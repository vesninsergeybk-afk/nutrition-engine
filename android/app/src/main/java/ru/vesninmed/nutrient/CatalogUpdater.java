package ru.vesninmed.nutrient;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.util.JsonReader;
import android.util.JsonToken;
import android.webkit.WebResourceResponse;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.GZIPInputStream;

/**
 * Optional data-only updates. The browser receives only local JSON via the
 * asset loader. All outbound traffic is native, restricted to public GitHub.
 */
final class CatalogUpdater {
    private static final String CHANNEL =
            "https://raw.githubusercontent.com/vesninsergeybk-afk/nutrition-engine/"
            + "refs/heads/nutrient-catalog/android/catalog/";
    private static final String STORE = "nutrient_catalog_v1";
    private static final long CHECK_INTERVAL_MS = 24L * 60 * 60 * 1000;
    private static final int MAX_MANIFEST_BYTES = 32 * 1024;
    private static final int MAX_GZIP_BYTES = 12 * 1024 * 1024;
    private static final int MAX_JSON_BYTES = 50 * 1024 * 1024;
    private static final int MAX_PRODUCTS = 100_000;
    private static final String FORMAT = "nutrient-catalog-v1";
    private static final String[] NUTRIENTS = {
            "kcal", "protein_per_100g", "fat_per_100g", "carbs_per_100g",
            "sugar_per_100g", "fiber_per_100g", "sfa", "unsat", "added_sugar",
            "salt", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg",
            "potassium_mg", "sodium_mg", "zinc_mg", "copper_mg", "manganese_mg",
            "selenium_ug", "vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg",
            "vitamin_c_mg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg",
            "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg",
            "choline_mg", "vitamin_k_mcg"
    };
    private static final Set<String> NUTRIENT_SET =
            new HashSet<>(Arrays.asList(NUTRIENTS));

    interface Listener { void onStatus(JSONObject status); }

    private final Context context;
    private final SharedPreferences preferences;
    private final Handler main;
    private final Listener listener;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final File active;
    private final JSONObject bundled;
    private final String productPath;
    private volatile boolean checking;
    private volatile String state = "ready";
    private volatile String message = "Расчёты доступны без интернета.";

    CatalogUpdater(Context context, Handler main, Listener listener) throws Exception {
        this.context = context.getApplicationContext();
        this.main = main;
        this.listener = listener;
        preferences = this.context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        active = new File(this.context.getFilesDir(), "nutrient-catalog-active.json");
        try (InputStream in = this.context.getAssets().open("assets/nutrient-catalog.json")) {
            bundled = new JSONObject(new String(readBounded(in, MAX_MANIFEST_BYTES),
                    StandardCharsets.UTF_8));
        }
        String runtime = bundled.getJSONObject("origin").getString("runtime");
        if (!runtime.matches("[a-z0-9]{16,64}"))
            throw new IOException("Invalid bundled runtime");
        productPath = "/tools/nutrition/runtime/" + runtime + "/products.json";
    }

    boolean isCatalogPath(String path) { return productPath.equals(path); }

    /** Returns null to fall back to the immutable, installed APK catalog. */
    WebResourceResponse cachedResponse() {
        if (!active.isFile()) return null;
        try {
            return new WebResourceResponse("application/json", "UTF-8",
                    new FileInputStream(active));
        } catch (IOException ignored) { return null; }
    }

    synchronized String statusJson() {
        JSONObject status = status();
        return status.toString();
    }

    private synchronized JSONObject status() {
        JSONObject status = new JSONObject();
        try {
            status.put("state", checking ? "checking" : state);
            status.put("message", message);
            status.put("productCount", active.isFile()
                    ? preferences.getInt("count", bundled.optInt("productCount"))
                    : bundled.optInt("productCount"));
            status.put("lastSuccessTime", preferences.getLong("lastSuccess", 0));
            status.put("activationPending", "updated".equals(state));
        } catch (Exception ignored) {}
        return status;
    }

    private void setStatus(String newState, String newMessage) {
        final JSONObject status;
        synchronized (this) {
            state = newState;
            message = newMessage;
            status = status();
        }
        main.post(() -> listener.onStatus(status));
    }

    void check(boolean manual) {
        synchronized (this) {
            if (checking) return;
            long since = System.currentTimeMillis() - preferences.getLong("lastAttempt", 0);
            if (!manual && since >= 0 && since < CHECK_INTERVAL_MS) return;
            checking = true;
        }
        setStatus("checking", "Проверяю базу продуктов…");
        worker.execute(() -> {
            try {
                preferences.edit().putLong("lastAttempt", System.currentTimeMillis()).apply();
                update();
            } catch (Exception error) {
                setStatus("error", "Не удалось проверить обновления. Сохранённая база работает.");
            } finally {
                synchronized (this) { checking = false; }
                // Reflect the finished state in the JavaScript button.
                setStatus(state, message);
            }
        });
    }

    private void update() throws Exception {
        JSONObject manifest;
        try (InputStream in = download(CHANNEL + "latest.json", MAX_MANIFEST_BYTES)) {
            manifest = new JSONObject(new String(readBounded(in, MAX_MANIFEST_BYTES),
                    StandardCharsets.UTF_8));
        }
        if (!FORMAT.equals(manifest.optString("format"))
                || manifest.optInt("schemaVersion") != 1
                || manifest.optInt("minAndroidVersionCode") > 2)
            throw new IOException("Incompatible catalog schema");
        String jsonHash = requireSha(manifest.getString("jsonSha256"));
        String gzipHash = requireSha(manifest.getString("gzipSha256"));
        if (!jsonHash.equals(manifest.optString("version"))
                || !manifest.optString("archive").equals("catalog-" + gzipHash + ".json.gz"))
            throw new IOException("Invalid catalog manifest");
        int count = manifest.getInt("productCount");
        if (count < bundled.getInt("productCount") || count > MAX_PRODUCTS)
            throw new IOException("Unexpected food count");
        String installedHash = active.isFile()
                ? preferences.getString("activeHash", "") : bundled.getString("jsonSha256");
        if (jsonHash.equals(installedHash)) {
            preferences.edit().putLong("lastSuccess", System.currentTimeMillis()).apply();
            setStatus("current", "База продуктов актуальна.");
            return;
        }

        byte[] compressed;
        try (InputStream in = download(CHANNEL + "catalog-" + gzipHash + ".json.gz",
                                       MAX_GZIP_BYTES)) {
            compressed = readBounded(in, MAX_GZIP_BYTES);
        }
        if (!gzipHash.equals(sha256(compressed)))
            throw new IOException("Catalog archive hash mismatch");
        byte[] json;
        try (GZIPInputStream in = new GZIPInputStream(new ByteArrayInputStream(compressed))) {
            json = readBounded(in, MAX_JSON_BYTES);
        }
        if (!jsonHash.equals(sha256(json)))
            throw new IOException("Catalog JSON hash mismatch");
        Set<String> proposed = validateCatalog(new ByteArrayInputStream(json), count);
        Set<String> current;
        if (active.isFile()) {
            try (InputStream input = new FileInputStream(active)) {
                current = readKeys(input);
            }
        } else {
            try (InputStream input = context.getAssets().open(productPath.substring(1))) {
                current = readKeys(input);
            }
        }
        if (!proposed.containsAll(current))
            throw new IOException("A published update would delete an existing product");

        // A rename within the private app directory is atomic on Android.
        File pending = new File(context.getFilesDir(), "nutrient-catalog-next.json");
        try {
            try (FileOutputStream out = new FileOutputStream(pending)) {
                out.write(json);
                out.getFD().sync();
            }
            Files.move(pending.toPath(), active.toPath(), StandardCopyOption.ATOMIC_MOVE,
                    StandardCopyOption.REPLACE_EXISTING);
        } finally {
            if (pending.exists()) pending.delete();
        }
        preferences.edit().putString("activeHash", jsonHash).putInt("count", count)
                .putLong("lastSuccess", System.currentTimeMillis()).apply();
        setStatus("updated", "База обновлена. Новые продукты появятся при следующем запуске.");
    }

    private static InputStream download(String url, int limit) throws IOException {
        // Caller closes the returned stream and disconnects via its wrapper.
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(8000);
        connection.setRequestProperty("Accept", "application/json, application/gzip");
        connection.setRequestProperty("Accept-Encoding", "identity");
        int status = connection.getResponseCode();
        if (status != 200) {
            connection.disconnect();
            throw new IOException("Catalog HTTP " + status);
        }
        long length = connection.getContentLengthLong();
        if (length > limit) {
            connection.disconnect();
            throw new IOException("Catalog exceeded the byte limit");
        }
        return new java.io.FilterInputStream(connection.getInputStream()) {
            @Override public void close() throws IOException {
                try { super.close(); } finally { connection.disconnect(); }
            }
        };
    }

    private static byte[] readBounded(InputStream in, int max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int n;
        while ((n = in.read(buffer)) != -1) {
            if (out.size() > max - n) throw new IOException("Catalog is too large");
            out.write(buffer, 0, n);
        }
        return out.toByteArray();
    }

    private static String requireSha(String hex) throws IOException {
        if (!hex.matches("[0-9a-f]{64}")) throw new IOException("Invalid SHA-256");
        return hex;
    }

    private static String sha256(byte[] data) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);
        StringBuilder result = new StringBuilder(64);
        for (byte b : digest) result.append(String.format(java.util.Locale.ROOT, "%02x", b & 0xff));
        return result.toString();
    }

    private static Set<String> readKeys(InputStream in) throws IOException {
        HashSet<String> keys = new HashSet<>();
        try (JsonReader reader = new JsonReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            reader.beginArray();
            while (reader.hasNext()) {
                reader.beginObject();
                String key = null;
                while (reader.hasNext()) {
                    if ("key".equals(reader.nextName())) key = reader.nextString();
                    else reader.skipValue();
                }
                reader.endObject();
                if (key == null || !keys.add(key)) throw new IOException("Invalid product key");
            }
            reader.endArray();
        }
        return keys;
    }

    private static Set<String> validateCatalog(InputStream in, int expectedCount) throws IOException {
        HashSet<String> keys = new HashSet<>();
        try (JsonReader reader = new JsonReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            reader.beginArray();
            while (reader.hasNext()) {
                reader.beginObject();
                String key = null;
                String name = null;
                boolean hasProvenance = false;
                Map<String, Double> values = new HashMap<>();
                HashSet<String> classified = new HashSet<>();
                while (reader.hasNext()) {
                    String field = reader.nextName();
                    if ("key".equals(field)) key = reader.nextString();
                    else if ("name_ru".equals(field)) name = reader.nextString();
                    else if (NUTRIENT_SET.contains(field)) {
                        if (reader.peek() != JsonToken.NUMBER) throw new IOException("Missing nutrient");
                        double value = reader.nextDouble();
                        if (!Double.isFinite(value) || value < 0) throw new IOException("Invalid nutrient");
                        values.put(field, value);
                    } else if ("nutrient_provenance_v1_3".equals(field)) {
                        hasProvenance = true;
                        reader.beginObject();
                        while (reader.hasNext()) {
                            String classification = reader.nextName();
                            reader.beginArray();
                            while (reader.hasNext()) {
                                String nutrient = reader.nextString();
                                if (!NUTRIENT_SET.contains(nutrient) || !classified.add(nutrient))
                                    throw new IOException("Invalid nutrient provenance");
                            }
                            reader.endArray();
                        }
                        reader.endObject();
                    } else reader.skipValue();
                }
                reader.endObject();
                if (key == null || key.trim().isEmpty() || key.length() > 160 || !keys.add(key)
                        || name == null || name.trim().isEmpty() || values.size() != NUTRIENTS.length
                        || !hasProvenance || classified.size() != NUTRIENTS.length)
                    throw new IOException("Incomplete or duplicate food record");
                if (keys.size() > MAX_PRODUCTS) throw new IOException("Too many products");
            }
            reader.endArray();
            if (reader.peek() != JsonToken.END_DOCUMENT)
                throw new IOException("Trailing catalog data");
        }
        if (keys.size() != expectedCount) throw new IOException("Wrong catalog size");
        return keys;
    }

    void close() { worker.shutdownNow(); }
}
