#!/usr/bin/env bash
set -euo pipefail
ROOT="${APP_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
PORT=$(python3 - <<'PY'
import socket
s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()
PY
)
TMP=$(mktemp -d /tmp/nutri-apache-XXXXXX)
PID=''
cleanup(){
  rm -f "$ROOT/api/integrity-failed.flag" "$ROOT/api/gemini-disabled.flag"
  if [[ -n "$PID" ]]; then
    kill -TERM -- "-$PID" 2>/dev/null || kill -TERM "$PID" 2>/dev/null || true
    for _ in $(seq 1 50); do kill -0 "$PID" 2>/dev/null || break; sleep .05; done
    if kill -0 "$PID" 2>/dev/null; then kill -KILL -- "-$PID" 2>/dev/null || kill -KILL "$PID" 2>/dev/null || true; fi
    wait "$PID" 2>/dev/null || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT
cat > "$TMP/httpd.conf" <<EOF
ServerRoot "/etc/apache2"
PidFile "$TMP/httpd.pid"
Listen 127.0.0.1:$PORT
IncludeOptional mods-enabled/*.load
IncludeOptional mods-enabled/*.conf
LoadModule headers_module /usr/lib/apache2/modules/mod_headers.so
User www-data
Group www-data
ServerName 127.0.0.1
ErrorLog "$TMP/error.log"
CustomLog "$TMP/access.log" combined
LogLevel warn
DocumentRoot "$ROOT"
<Directory "$ROOT">
    Options -Indexes
    AllowOverride All
    Require all granted
</Directory>
DirectoryIndex index.html
EOF
apache2 -t -f "$TMP/httpd.conf" >/dev/null
mkdir -p "$TMP/guard"; chown www-data:www-data "$TMP/guard"; chmod 700 "$TMP/guard"
NUTRITION_GEMINI_ENABLED=0 NUTRITION_GEMINI_GUARD_DIR="$TMP/guard" setsid apache2 -f "$TMP/httpd.conf" -DFOREGROUND >"$TMP/stdout" 2>&1 & PID=$!
for _ in $(seq 1 50); do if curl -fsS "http://127.0.0.1:$PORT/api/gemini.php" -o "$TMP/health.json" 2>/dev/null; then break; fi; sleep .1; done
python3 - "$TMP/health.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1]));assert j['ok'] is True and j['ai_available'] is False and len(j['csrf_token'])==64
PY
SECRET_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/gemini-secret.php")
printf 'test' > "$ROOT/api/integrity-failed.flag"
printf 'test' > "$ROOT/api/gemini-disabled.flag"
INTEGRITY_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/integrity-failed.flag")
DISABLED_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/gemini-disabled.flag")
rm -f "$ROOT/api/integrity-failed.flag" "$ROOT/api/gemini-disabled.flag"
[[ "$SECRET_STATUS" == 403 && "$INTEGRITY_STATUS" == 403 && "$DISABLED_STATUS" == 403 ]]
OLD208_STATUS=$(curl -sS -o "$TMP/old208.html" -w '%{http_code}' "http://127.0.0.1:$PORT/index-v5.3.208.html")
OLD209_STATUS=$(curl -sS -o "$TMP/old209.html" -w '%{http_code}' "http://127.0.0.1:$PORT/index-v5.3.209.html")
TEST_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/tests/p0-4-health-worker.php")
if [[ -f "$ROOT/index-v5.3.208.html" && -f "$ROOT/index-v5.3.209.html" ]]; then
  [[ "$OLD208_STATUS" == 200 && "$OLD209_STATUS" == 200 ]]
  grep -q 'data-retired-entrypoint="v5.3.210-rc2"' "$TMP/old208.html"
  grep -q 'data-retired-entrypoint="v5.3.210-rc2"' "$TMP/old209.html"
else
  [[ "$OLD208_STATUS" == 404 && "$OLD209_STATUS" == 404 ]]
fi
[[ "$TEST_STATUS" == 403 || "$TEST_STATUS" == 404 ]]
HEADERS=$(curl -sS -D - -o /dev/null "http://127.0.0.1:$PORT/api/gemini.php")
! grep -qi '^X-Powered-By:' <<<"$HEADERS"
grep -qi '^X-Content-Type-Options: nosniff' <<<"$HEADERS"
grep -qi '^Cross-Origin-Resource-Policy: same-origin' <<<"$HEADERS"
grep -qi '^X-Robots-Tag: .*noindex' <<<"$HEADERS"
ASSET_HEADERS=$(curl -sS -D - -o /dev/null "http://127.0.0.1:$PORT/assets/js/69-release-support-v5.3.210-rc2.js")
grep -qi '^Cache-Control: .*max-age=31536000.*immutable' <<<"$ASSET_HEADERS"
ROBOTS=$(curl -fsS "http://127.0.0.1:$PORT/robots.txt")
grep -q '^Disallow: /' <<<"$ROBOTS"
GZIP_HEADERS=$(curl -sS -D - -o /dev/null -H 'Accept-Encoding: gzip' "http://127.0.0.1:$PORT/assets/js/69-release-support-v5.3.210-rc2.js")
grep -qi '^Content-Encoding: gzip' <<<"$GZIP_HEADERS"
dd if=/dev/zero of="$TMP/oversize.bin" bs=1M count=9 status=none
OVER_STATUS=$(curl --max-time 20 -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data-binary @"$TMP/oversize.bin" "http://127.0.0.1:$PORT/api/gemini.php")
[[ "$OVER_STATUS" == 413 ]]
printf '{"status":"PASS","assertions":15,"secret_status":%s,"integrity_status":%s,"disabled_status":%s,"old_208_status":%s,"old_209_status":%s,"test_status":%s,"oversize_status":%s,"beta_headers":true,"immutable_cache":true,"robots_noindex":true,"compression":true}\n' "$SECRET_STATUS" "$INTEGRITY_STATUS" "$DISABLED_STATUS" "$OLD208_STATUS" "$OLD209_STATUS" "$TEST_STATUS" "$OVER_STATUS"
