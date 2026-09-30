const BASE = process.env.ACCOUNT_TEST_BASE || "http://127.0.0.1:18080";
const ORIGIN = process.env.ACCOUNT_TEST_ORIGIN || "http://127.0.0.1:19090";
const CONSENT_VERSION = process.env.PRIVACY_CONSENT_VERSION || "test-v1";

async function request(path, { method = "GET", token = "", cookie = "", body, raw = false } = {}) {
  const headers = { Origin: ORIGIN };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = "Bearer " + token;
  if (cookie) headers.cookie = cookie;

  const response = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(
      method + " " + path + " -> " + response.status + " " + JSON.stringify(payload)
    );
  }

  if (raw) {
    return {
      payload,
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status,
    };
  }

  return payload;
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const health = await request("/health");
      if (health.ok) return health;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Account service did not become healthy");
}

await waitForHealth();

const config = await request("/api/account/config");
if (!config.enabled) throw new Error("Account service is not enabled in test configuration");
if (config.consentVersion !== CONSENT_VERSION) {
  throw new Error("Consent version mismatch");
}

const username = "ci_user_" + Date.now();
const email = username + "@example.test";
const password = "long-test-password-123";

const registrationResponse = await request("/api/account/register", {
  method: "POST",
  raw: true,
  body: {
    username,
    email,
    password,
    consentAccepted: true,
    consentVersion: CONSENT_VERSION,
  },
});
const registered = registrationResponse.payload;

if (registered.user?.username !== username || !registered.token) {
  throw new Error("Registration did not return a usable account");
}

const setCookie = registrationResponse.headers["set-cookie"] || "";
if (
  !/mm_session=/.test(setCookie) ||
  !/HttpOnly/i.test(setCookie) ||
  !/Secure/i.test(setCookie) ||
  !/SameSite=Lax/i.test(setCookie)
) {
  throw new Error("Registration did not set a protected browser session cookie");
}

const sessionCookie = setCookie.split(";")[0];
const cookieMe = await request("/api/account/me", { cookie: sessionCookie });
if (cookieMe.user?.email !== email) {
  throw new Error("Protected browser session cookie did not authenticate");
}

const token = registered.token;

const me = await request("/api/account/me", { token });
if (me.user?.email !== email) throw new Error("Bearer compatibility profile mismatch");

const initial = await request("/api/progress", { token });
if (Number(initial.revision) !== 0) {
  throw new Error("Fresh progress must start at revision 0");
}

const store = {
  version: 1,
  updatedAt: Date.now(),
  records: {
    "deltoid::find": {
      attempts: 2,
      correct: 1,
      wrong: 1,
      lastSeen: Date.now(),
      reviewDebt: 1,
      reviewCount: 1,
      lapses: 1,
    },
  },
  confusions: {
    "find::deltoid::supraspinatus": {
      skillId: "find",
      expectedMuscleId: "deltoid",
      chosenMuscleId: "supraspinatus",
      count: 1,
      lastSeen: Date.now(),
    },
  },
  sessions: [
    {
      sessionId: "ci-session",
      mode: "find",
      region: "shoulder",
      total: 2,
      clean: 1,
      completedAt: Date.now(),
    },
  ],
};

const saved = await request("/api/progress", {
  method: "PUT",
  token,
  body: { revision: 0, store },
});
if (Number(saved.revision) !== 1) throw new Error("Progress revision did not advance");

const loaded = await request("/api/progress", { token });
if (loaded.store?.records?.["deltoid::find"]?.wrong !== 1) {
  throw new Error("Saved learning progress did not round-trip");
}
if (loaded.store?.confusions?.["find::deltoid::supraspinatus"]?.count !== 1) {
  throw new Error("Saved confusion pair did not round-trip");
}

let conflictCaught = false;
try {
  await request("/api/progress", {
    method: "PUT",
    token,
    body: { revision: 0, store },
  });
} catch (error) {
  conflictCaught = /409/.test(String(error));
}
if (!conflictCaught) throw new Error("Stale progress revision must return 409");

const login = await request("/api/account/login", {
  method: "POST",
  body: { identifier: username, password },
});
if (!login.token || login.user?.email !== email) {
  throw new Error("Login did not return the account");
}

await request("/api/account/request-password-reset", {
  method: "POST",
  body: { email },
});

const exported = await request("/api/account/export", { token });
if (exported.user?.email !== email) throw new Error("Account export is missing profile");
if (exported.progress?.store?.records?.["deltoid::find"]?.attempts !== 2) {
  throw new Error("Account export is missing progress");
}
if (!Array.isArray(exported.consents) || exported.consents.length !== 1) {
  throw new Error("Account export is missing consent record");
}
if (exported.consents[0].consent_version !== CONSENT_VERSION) {
  throw new Error("Consent record version mismatch");
}

await request("/api/account", { method: "DELETE", token, body: {} });

let deleted = false;
try {
  await request("/api/account/me", { token });
} catch (error) {
  deleted = /401/.test(String(error));
}
if (!deleted) throw new Error("Deleted account session must no longer authenticate");

console.log("OK: account lifecycle, progress persistence, revision conflict, recovery request, export and deletion");
