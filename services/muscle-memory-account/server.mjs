import http from "node:http";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import nodemailer from "nodemailer";

const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || "";
const PUBLIC_APP_URL = String(process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
const APP_ORIGINS = new Set(String(process.env.APP_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean));
const CONSENT_VERSION = String(process.env.PRIVACY_CONSENT_VERSION || "");
const OPERATOR = {
  name: String(process.env.DATA_OPERATOR_FULL_NAME || "").trim(),
  address: String(process.env.DATA_OPERATOR_ADDRESS || "").trim(),
  email: String(process.env.DATA_OPERATOR_EMAIL || "").trim(),
};
const SMTP = {
  host: String(process.env.SMTP_HOST || ""),
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
  user: String(process.env.SMTP_USER || ""),
  pass: String(process.env.SMTP_PASS || ""),
  from: String(process.env.SMTP_FROM || ""),
};
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_DAYS || 30));
const CROSS_BORDER_TRANSFER = String(process.env.CROSS_BORDER_TRANSFER || "false").toLowerCase() === "true";

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: DATABASE_URL });
await pool.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));

const mailer = SMTP.host && SMTP.user && SMTP.pass && SMTP.from
  ? nodemailer.createTransport({
      host: SMTP.host,
      port: SMTP.port,
      secure: SMTP.secure,
      auth: { user: SMTP.user, pass: SMTP.pass },
    })
  : null;

const legalReady =
  Boolean(OPERATOR.name && OPERATOR.address && OPERATOR.email && CONSENT_VERSION) &&
  !CROSS_BORDER_TRANSFER;
const accountReady = legalReady && Boolean(mailer) && Boolean(PUBLIC_APP_URL);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function consentText() {
  return [
    "Я свободно, своей волей и в своём интересе даю согласие оператору " + OPERATOR.name + ", адрес: " + OPERATOR.address + ",",
    "на обработку следующих персональных данных: имя пользователя, адрес электронной почты, данные об аккаунте, сведения о принятом согласии и учебный прогресс,",
    "включая попытки, ошибки, историю тренировок, очередь повторения и связанные учебные показатели.",
    "Цели обработки: создание и защита аккаунта, восстановление доступа, синхронизация учебного прогресса между устройствами,",
    "показ общей статистики и предоставление возможности повторять ошибки.",
    "Разрешённые действия: сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование, блокирование и удаление.",
    "Пароль в открытом виде не сохраняется; сохраняется только его криптографический хэш.",
    "Согласие действует до удаления аккаунта или до его отзыва путём обращения к оператору по адресу " + OPERATOR.email + ".",
    "После отзыва обработка прекращается и данные удаляются в пределах и сроки, установленные применимым законодательством, если иное хранение не требуется законом.",
    "Редакция согласия: " + CONSENT_VERSION + ".",
  ].join(" ");
}

const CONSENT_HASH = createHash("sha256").update(consentText()).digest("hex");

function legalPage(title, body) {
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    escapeHtml(title) +
    '</title><style>body{max-width:820px;margin:40px auto;padding:0 20px;font:16px/1.65 system-ui,sans-serif;color:#202b3b}h1,h2{line-height:1.25}.note{padding:14px 16px;background:#f3f6fa;border:1px solid #dce3ec;border-radius:12px}</style></head><body><h1>' +
    escapeHtml(title) + "</h1>" + body + "</body></html>";
}

function privacyHtml() {
  return legalPage(
    "Политика обработки персональных данных — Muscle Memory",
    '<p class="note">Редакция: ' + escapeHtml(CONSENT_VERSION || "не активирована") + ".</p>" +
    "<h2>1. Оператор</h2><p><strong>" + escapeHtml(OPERATOR.name || "Не указан") +
    "</strong><br>Адрес: " + escapeHtml(OPERATOR.address || "Не указан") +
    "<br>Контакт: " + escapeHtml(OPERATOR.email || "Не указан") + "</p>" +
    "<h2>2. Какие данные обрабатываются</h2><p>Имя пользователя, адрес электронной почты, хэш пароля, сведения о принятом согласии, технические данные сессии и учебный прогресс: попытки, ошибки, история тренировок и очередь повторения.</p>" +
    "<p>Пароль в открытом виде не сохраняется. Для аккаунта не запрашиваются паспортные, платёжные, медицинские или биометрические данные.</p>" +
    "<h2>3. Цели</h2><p>Создание и защита аккаунта, восстановление доступа, синхронизация учебного прогресса между устройствами, показ общей статистики и повторение ошибок.</p>" +
    "<h2>4. Действия</h2><p>Сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование, блокирование и удаление.</p>" +
    "<h2>5. Локализация</h2><p>Первичная база аккаунтов и учебного прогресса граждан Российской Федерации размещается на территории Российской Федерации. Трансграничная передача в данной production-конфигурации не осуществляется.</p>" +
    "<h2>6. Срок</h2><p>До удаления аккаунта пользователем, отзыва согласия либо прекращения работы сервиса, если более длительное хранение не требуется по закону.</p>" +
    "<h2>7. Защита</h2><p>Пароли хэшируются, сессии используют случайные токены, публичное соединение должно работать по HTTPS, доступ к базе ограничивается.</p>" +
    "<h2>8. Права пользователя</h2><p>Пользователь может запросить сведения о данных, их уточнение или удаление и отозвать согласие. Аккаунт и облачный прогресс можно удалить в интерфейсе либо обратиться по адресу " +
    escapeHtml(OPERATOR.email || "") + ".</p>" +
    "<h2>9. Основание</h2><p>Федеральный закон №152-ФЗ «О персональных данных» и отдельное согласие пользователя в случаях, когда согласие требуется.</p>"
  );
}

function consentHtml() {
  return legalPage(
    "Согласие на обработку персональных данных",
    '<p class="note">Согласие оформлено отдельно от политики и других документов сервиса.</p><p>' +
    escapeHtml(consentText()) +
    "</p><h2>Перечень данных</h2><p>Имя пользователя, email, данные аккаунта и учебного прогресса. Пароль сохраняется только в виде криптографического хэша.</p>" +
    "<h2>Отзыв</h2><p>Согласие можно отозвать удалением аккаунта или обращением к оператору: " +
    escapeHtml(OPERATOR.email || "контакт не настроен") + ".</p>"
  );
}

function sendJson(res, status, payload, origin = "") {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };
  if (origin && APP_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function sendHtml(res, status, body) {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy":
      "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  });
  res.end(body);
}

async function readJson(req, limit = 1_100_000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) throw Object.assign(new Error("body-too-large"), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("invalid-json"), { status: 400 });
  }
}

function normUser(value) {
  return String(value || "").trim().normalize("NFKC").toLocaleLowerCase("ru-RU");
}
function normEmail(value) {
  return String(value || "").trim().toLowerCase();
}
function validUsername(value) {
  return /^[\p{L}\p{N}._-]{3,32}$/u.test(String(value || "").trim());
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim()) &&
    String(value || "").length <= 254;
}
function validPassword(value) {
  const text = String(value || "");
  return text.length >= 10 && text.length <= 128;
}
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, 64);
  return "scrypt$" + salt.toString("base64url") + "$" + hash.toString("base64url");
}
function checkPassword(password, stored) {
  const [scheme, saltText, hashText] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltText || !hashText) return false;
  try {
    const expected = Buffer.from(hashText, "base64url");
    const actual = scryptSync(
      String(password),
      Buffer.from(saltText, "base64url"),
      expected.length
    );
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
function tokenHash(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
function newToken() {
  return randomBytes(32).toString("base64url");
}
function bearer(req) {
  const value = String(req.headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}
function validStore(store) {
  return Boolean(
    store &&
    store.version === 1 &&
    typeof store.records === "object" &&
    JSON.stringify(store).length <= 1_000_000
  );
}

const buckets = new Map();
function rate(key, max = 12, windowMs = 600_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.until <= now) {
    buckets.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= max;
}
function requestKey(req, suffix) {
  return String(req.socket.remoteAddress || "unknown") + ":" + suffix;
}

async function userFromRequest(req) {
  const token = bearer(req);
  if (!token) return null;
  const result = await pool.query(
    "SELECT u.id,u.username,u.email FROM mm_sessions s JOIN mm_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [tokenHash(token)]
  );
  return result.rows[0] || null;
}

async function makeSession(userId) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await pool.query(
    "INSERT INTO mm_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
    [tokenHash(token), userId, expiresAt]
  );
  return { token, expiresAt: expiresAt.toISOString() };
}

async function sendReset(email, token) {
  const url = PUBLIC_APP_URL + "/?reset=" + encodeURIComponent(token) + "#account";
  await mailer.sendMail({
    from: SMTP.from,
    to: email,
    subject: "Восстановление доступа к Muscle Memory",
    text:
      "Для смены пароля откройте ссылку:\n" + url +
      "\n\nСсылка действует 30 минут. Если вы не запрашивали восстановление, ничего делать не нужно.",
  });
}

const server = http.createServer(async (req, res) => {
  const origin = String(req.headers.origin || "");

  if (req.method === "OPTIONS") {
    if (!origin || !APP_ORIGINS.has(origin)) {
      return sendJson(res, 403, { error: "origin-not-allowed" });
    }
    res.writeHead(204, {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-max-age": "600",
      vary: "Origin",
    });
    res.end();
    return;
  }

  if (origin && !APP_ORIGINS.has(origin)) {
    return sendJson(res, 403, { error: "origin-not-allowed" });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/health") {
      return sendJson(res, 200, { ok: true, accountReady });
    }
    if (req.method === "GET" && path === "/api/account/config") {
      return sendJson(res, 200, {
        enabled: accountReady,
        consentVersion: CONSENT_VERSION || null,
        privacyUrl: "/legal/privacy",
        consentUrl: "/legal/consent",
        recoveryEnabled: Boolean(mailer),
        reason: accountReady ? null : "server-not-ready",
      }, origin);
    }
    if (req.method === "GET" && path === "/legal/privacy") {
      return sendHtml(res, legalReady ? 200 : 503, privacyHtml());
    }
    if (req.method === "GET" && path === "/legal/consent") {
      return sendHtml(res, legalReady ? 200 : 503, consentHtml());
    }

    if (req.method === "POST" && path === "/api/account/register") {
      if (!accountReady) return sendJson(res, 503, { error: "account-service-not-ready" }, origin);
      if (!rate(requestKey(req, "register"), 8)) {
        return sendJson(res, 429, { error: "too-many-attempts" }, origin);
      }
      const body = await readJson(req, 20_000);
      const username = String(body.username || "").trim().normalize("NFKC");
      const email = String(body.email || "").trim();
      const password = String(body.password || "");

      if (!validUsername(username)) return sendJson(res, 400, { error: "invalid-username" }, origin);
      if (!validEmail(email)) return sendJson(res, 400, { error: "invalid-email" }, origin);
      if (!validPassword(password)) return sendJson(res, 400, { error: "weak-password" }, origin);
      if (body.consentVersion !== CONSENT_VERSION || body.consentAccepted !== true) {
        return sendJson(res, 400, { error: "consent-required" }, origin);
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const id = randomUUID();
        await client.query(
          "INSERT INTO mm_users(id,username,username_norm,email,email_norm,password_hash) VALUES($1,$2,$3,$4,$5,$6)",
          [id, username, normUser(username), email, normEmail(email), hashPassword(password)]
        );
        await client.query(
          "INSERT INTO mm_consents(user_id,consent_version,consent_text_hash) VALUES($1,$2,$3)",
          [id, CONSENT_VERSION, CONSENT_HASH]
        );
        await client.query("INSERT INTO mm_progress(user_id) VALUES($1)", [id]);
        await client.query("COMMIT");
        const session = await makeSession(id);
        return sendJson(res, 201, { user: { id, username, email }, ...session }, origin);
      } catch (error) {
        await client.query("ROLLBACK");
        if (error?.code === "23505") {
          return sendJson(res, 409, { error: "username-or-email-exists" }, origin);
        }
        throw error;
      } finally {
        client.release();
      }
    }

    if (req.method === "POST" && path === "/api/account/login") {
      if (!accountReady) return sendJson(res, 503, { error: "account-service-not-ready" }, origin);
      if (!rate(requestKey(req, "login"), 15)) {
        return sendJson(res, 429, { error: "too-many-attempts" }, origin);
      }
      const body = await readJson(req, 20_000);
      const identifier = String(body.identifier || "").trim();
      const result = await pool.query(
        "SELECT id,username,email,password_hash FROM mm_users WHERE username_norm=$1 OR email_norm=$2 LIMIT 1",
        [normUser(identifier), normEmail(identifier)]
      );
      const user = result.rows[0];
      if (!user || !checkPassword(body.password, user.password_hash)) {
        return sendJson(res, 401, { error: "invalid-credentials" }, origin);
      }
      const session = await makeSession(user.id);
      return sendJson(res, 200, {
        user: { id: user.id, username: user.username, email: user.email },
        ...session,
      }, origin);
    }

    if (req.method === "POST" && path === "/api/account/request-password-reset") {
      if (!accountReady) return sendJson(res, 503, { error: "account-service-not-ready" }, origin);
      if (!rate(requestKey(req, "reset"), 6)) {
        return sendJson(res, 429, { error: "too-many-attempts" }, origin);
      }
      const body = await readJson(req, 10_000);
      const result = await pool.query(
        "SELECT id,email FROM mm_users WHERE email_norm=$1 LIMIT 1",
        [normEmail(body.email)]
      );
      const user = result.rows[0];
      if (user) {
        const token = newToken();
        await pool.query(
          "INSERT INTO mm_password_resets(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",
          [tokenHash(token), user.id]
        );
        try {
          await sendReset(user.email, token);
        } catch (mailError) {
          console.error("Password reset mail failed", mailError);
        }
      }
      return sendJson(res, 200, { ok: true }, origin);
    }

    if (req.method === "POST" && path === "/api/account/reset-password") {
      if (!accountReady) return sendJson(res, 503, { error: "account-service-not-ready" }, origin);
      const body = await readJson(req, 20_000);
      if (!validPassword(body.password)) {
        return sendJson(res, 400, { error: "weak-password" }, origin);
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          "SELECT user_id FROM mm_password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE",
          [tokenHash(body.token)]
        );
        const reset = result.rows[0];
        if (!reset) {
          await client.query("ROLLBACK");
          return sendJson(res, 400, { error: "invalid-or-expired-reset" }, origin);
        }
        await client.query(
          "UPDATE mm_users SET password_hash=$1,updated_at=now() WHERE id=$2",
          [hashPassword(body.password), reset.user_id]
        );
        await client.query(
          "UPDATE mm_password_resets SET used_at=now() WHERE token_hash=$1",
          [tokenHash(body.token)]
        );
        await client.query("DELETE FROM mm_sessions WHERE user_id=$1", [reset.user_id]);
        await client.query("COMMIT");
        return sendJson(res, 200, { ok: true }, origin);
      } finally {
        client.release();
      }
    }

    if (req.method === "POST" && path === "/api/account/logout") {
      const token = bearer(req);
      if (token) {
        await pool.query("DELETE FROM mm_sessions WHERE token_hash=$1", [tokenHash(token)]);
      }
      return sendJson(res, 200, { ok: true }, origin);
    }

    const user = await userFromRequest(req);
    if (!user) return sendJson(res, 401, { error: "authentication-required" }, origin);

    if (req.method === "GET" && path === "/api/account/me") {
      return sendJson(res, 200, { user }, origin);
    }
    if (req.method === "GET" && path === "/api/account/export") {
      const progress = await pool.query(
        "SELECT revision,store,updated_at FROM mm_progress WHERE user_id=$1",
        [user.id]
      );
      const consents = await pool.query(
        "SELECT consent_version,consent_text_hash,accepted_at FROM mm_consents WHERE user_id=$1 ORDER BY accepted_at",
        [user.id]
      );
      return sendJson(res, 200, {
        user,
        progress: progress.rows[0] || null,
        consents: consents.rows,
      }, origin);
    }
    if (req.method === "DELETE" && path === "/api/account") {
      await pool.query("DELETE FROM mm_users WHERE id=$1", [user.id]);
      return sendJson(res, 200, { ok: true }, origin);
    }
    if (req.method === "GET" && path === "/api/progress") {
      const result = await pool.query(
        "SELECT revision,store,updated_at FROM mm_progress WHERE user_id=$1",
        [user.id]
      );
      return sendJson(
        res,
        200,
        result.rows[0] || { revision: 0, store: null, updated_at: null },
        origin
      );
    }
    if (req.method === "PUT" && path === "/api/progress") {
      const body = await readJson(req);
      if (!validStore(body.store)) {
        return sendJson(res, 400, { error: "invalid-progress-store" }, origin);
      }
      const revision = Math.max(0, Number(body.revision) || 0);
      const result = await pool.query(
        "UPDATE mm_progress SET store=$1::jsonb,revision=revision+1,updated_at=now() WHERE user_id=$2 AND revision=$3 RETURNING revision,updated_at",
        [JSON.stringify(body.store), user.id, revision]
      );
      if (!result.rowCount) {
        const latest = await pool.query(
          "SELECT revision,store,updated_at FROM mm_progress WHERE user_id=$1",
          [user.id]
        );
        return sendJson(res, 409, {
          error: "revision-conflict",
          latest: latest.rows[0],
        }, origin);
      }
      return sendJson(res, 200, result.rows[0], origin);
    }

    return sendJson(res, 404, { error: "not-found" }, origin);
  } catch (error) {
    console.error(error);
    return sendJson(
      res,
      Number(error?.status) || 500,
      { error: "server-error" },
      origin
    );
  }
});

setInterval(() => {
  void pool.query("DELETE FROM mm_sessions WHERE expires_at<=now()");
  void pool.query(
    "DELETE FROM mm_password_resets WHERE expires_at<=now() OR used_at IS NOT NULL"
  );
}, 3_600_000).unref();

server.listen(PORT, () => {
  console.log(
    "Muscle Memory account service listening on :" + PORT +
    " accountReady=" + accountReady
  );
});
