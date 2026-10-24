package ru.vesninmed.nutrient;

import android.app.Activity;
import android.print.PrintManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.label.ImageLabel;
import com.google.mlkit.vision.label.ImageLabeling;
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Offline-first shell with an optionally refreshed food database.
 * Remote WebView navigation remains blocked; only the native catalog loader networks.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://" + HOST + "/tools/nutrition/index.html";
    private static final int FILE_PICKER_REQUEST = 702;
    private static final int EXPORT_JSON_REQUEST = 703;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService imageWorker = Executors.newSingleThreadExecutor();
    private WebView webView;
    private CatalogUpdater catalogUpdater;
    private ValueCallback<Uri[]> pendingFileChooser;
    private String pendingJson;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            catalogUpdater = new CatalogUpdater(this, main, status -> {
                if (webView == null) return;
                String js = "window.dispatchEvent(new CustomEvent('nutrient-catalog-status',"
                        + "{detail:" + status.toString() + "}));";
                webView.evaluateJavascript(js, null);
            });
        } catch (Exception error) {
            android.util.Log.e("NutrientCatalog", "Bundled catalog metadata unavailable", error);
        }
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(0xfff4f7f4);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Android file picker returns content:// URIs.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        webView.addJavascriptInterface(new NativeBridge(), "NutrientNative");

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(
                    @NonNull WebView view, @NonNull WebResourceRequest request) {
                if (!HOST.equals(request.getUrl().getHost())) return deniedResponse();
                if (catalogUpdater != null
                        && catalogUpdater.isCatalogPath(request.getUrl().getPath())) {
                    WebResourceResponse cached = catalogUpdater.cachedResponse();
                    if (cached != null) return cached;
                }
                WebResourceResponse bundled = assetLoader.shouldInterceptRequest(request.getUrl());
                // No network fallthrough, even for missing appassets resources.
                return bundled != null ? bundled : deniedResponse();
            }

            @Override public boolean shouldOverrideUrlLoading(
                    @NonNull WebView view, @NonNull WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOST.equals(url.getHost()) && "https".equals(url.getScheme())) {
                    if ("/tools/nutrition/".equals(url.getPath())) {
                        view.loadUrl(APP_URL);
                        return true;
                    }
                    return false;
                }
                if (request.isForMainFrame()) {
                    Toast.makeText(MainActivity.this,
                            "Nutrient работает без интернета. Внешние ссылки не открываются.",
                            Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(android.webkit.ConsoleMessage message) {
                String value = message.message();
                if (value != null && value.startsWith("NUTRIENT_SMOKE_")) {
                    android.util.Log.i("NutrientSmoke", value);
                }
                return super.onConsoleMessage(message);
            }

            @Override public boolean onShowFileChooser(WebView view,
                    ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileChooser != null) pendingFileChooser.onReceiveValue(null);
                pendingFileChooser = callback;
                try {
                    Intent chooser = params.createIntent();
                    chooser.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(chooser, FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception error) {
                    pendingFileChooser = null;
                    callback.onReceiveValue(null);
                    Toast.makeText(MainActivity.this,
                            "Не удалось открыть выбор файла.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        setContentView(webView);
        webView.loadUrl(APP_URL);
        if (catalogUpdater != null) catalogUpdater.check(false);
    }

    private WebResourceResponse deniedResponse() {
        return new WebResourceResponse("text/plain", "UTF-8",
                new ByteArrayInputStream(new byte[0]));
    }

    @SuppressWarnings("deprecation")
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_PICKER_REQUEST) {
            if (pendingFileChooser != null) {
                pendingFileChooser.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingFileChooser = null;
            }
        } else if (requestCode == EXPORT_JSON_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null
                    && pendingJson != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out == null) throw new IllegalStateException("Нет доступа к файлу");
                    out.write(pendingJson.getBytes(StandardCharsets.UTF_8));
                    Toast.makeText(this, "Резервная копия сохранена.", Toast.LENGTH_SHORT).show();
                } catch (Exception error) {
                    Toast.makeText(this, "Не удалось сохранить резервную копию.",
                            Toast.LENGTH_LONG).show();
                }
            }
            pendingJson = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (pendingFileChooser != null) pendingFileChooser.onReceiveValue(null);
        if (webView != null) {
            webView.removeJavascriptInterface("NutrientNative");
            webView.destroy();
            webView = null;
        }
        imageWorker.shutdownNow();
        if (catalogUpdater != null) catalogUpdater.close();
        super.onDestroy();
    }

    private void sendPhotoResult(JSONObject data) {
        main.post(() -> {
            if (webView == null) return;
            String js = "window.dispatchEvent(new CustomEvent('nutrient-photo-result',"
                    + "{detail:" + data.toString() + "}));";
            webView.evaluateJavascript(js, null);
        });
    }

    private final class NativeBridge {
        @JavascriptInterface public String getCatalogStatus() {
            return catalogUpdater == null
                    ? "{\"productCount\":0,\"message\":\"Встроенная база доступна без интернета.\"}"
                    : catalogUpdater.statusJson();
        }

        @JavascriptInterface public void checkCatalogNow() {
            if (catalogUpdater != null) catalogUpdater.check(true);
        }

        @JavascriptInterface public void exportJson(String filename, String contents) {
            if (contents == null || contents.length() > 3_000_000) return;
            main.post(() -> {
                pendingJson = contents;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE,
                        filename != null && filename.endsWith(".json")
                                ? filename : "nutrient-ration.json");
                try {
                    startActivityForResult(intent, EXPORT_JSON_REQUEST);
                } catch (Exception error) {
                    pendingJson = null;
                    Toast.makeText(MainActivity.this,
                            "Не удалось выбрать место для сохранения.", Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface public void printReport() {
            main.post(() -> {
                PrintManager manager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (manager != null && webView != null) {
                    manager.print("Nutrient — отчёт",
                            webView.createPrintDocumentAdapter("Nutrient"),
                            null);
                }
            });
        }

        /** Only broad on-device labels, never an asserted dish weight or composition. */
        @JavascriptInterface public void classifyPhoto(String requestId, String base64) {
            final String id = requestId == null ? "" : requestId;
            imageWorker.execute(() -> {
                JSONObject response = new JSONObject();
                try {
                    response.put("id", id);
                    if (base64 == null || base64.length() > 3_000_000)
                        throw new IllegalArgumentException("Слишком большой файл");
                    byte[] raw = Base64.decode(base64, Base64.DEFAULT);
                    BitmapFactory.Options bounds = new BitmapFactory.Options();
                    bounds.inJustDecodeBounds = true;
                    BitmapFactory.decodeByteArray(raw, 0, raw.length, bounds);
                    if (bounds.outWidth <= 0 || bounds.outHeight <= 0)
                        throw new IllegalArgumentException("Неподдерживаемое изображение");
                    BitmapFactory.Options options = new BitmapFactory.Options();
                    int sample = 1;
                    while (Math.max(bounds.outWidth / sample, bounds.outHeight / sample) > 1280)
                        sample *= 2;
                    options.inSampleSize = sample;
                    Bitmap bitmap = BitmapFactory.decodeByteArray(raw, 0, raw.length, options);
                    if (bitmap == null) throw new IllegalArgumentException("Не удалось открыть фото");
                    var labeler = ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS);
                    labeler.process(InputImage.fromBitmap(bitmap, 0))
                            .addOnSuccessListener(labels -> {
                                JSONArray output = new JSONArray();
                                for (ImageLabel label : labels) {
                                    JSONObject item = new JSONObject();
                                    try {
                                        item.put("text", label.getText());
                                        item.put("confidence", label.getConfidence());
                                        output.put(item);
                                    } catch (Exception ignored) {}
                                }
                                try { response.put("labels", output); } catch (Exception ignored) {}
                                sendPhotoResult(response);
                                bitmap.recycle();
                                labeler.close();
                            })
                            .addOnFailureListener(error -> {
                                try { response.put("error", "Локальная модель не распознала фото"); }
                                catch (Exception ignored) {}
                                sendPhotoResult(response);
                                bitmap.recycle();
                                labeler.close();
                            });
                } catch (Exception error) {
                    try { response.put("error", error.getMessage()); } catch (Exception ignored) {}
                    sendPhotoResult(response);
                }
            });
        }
    }
}
