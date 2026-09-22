#!/usr/bin/env python3
"""Small, fail-closed static server for browser CI.

It never executes PHP and never exposes private/test/build files. The Gemini health
route is mocked so browser tests exercise the real client without provider calls.
"""
from __future__ import annotations
import argparse
import hashlib
import http.cookies
import json
import os
import posixpath
import secrets
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

DENIED_PREFIXES = ('/.git', '/.github', '/tests', '/tools', '/quality', '/reports', '/release')
DENIED_NAMES = {'.htaccess', '_headers', 'gemini-secret.php', 'gemini-guard.php',
                'gemini-disabled.flag', 'integrity-failed.flag'}

class Handler(SimpleHTTPRequestHandler):
    server_version = 'NutritionCITestServer/1'

    def log_message(self, fmt, *args):
        if os.getenv('CI_SERVER_VERBOSE') == '1':
            super().log_message(fmt, *args)

    def _headers(self, content_type='application/json; charset=utf-8'):
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Permissions-Policy', 'geolocation=(), camera=(self), microphone=(self)')

    def _json(self, status, payload, cookie=None):
        raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode()
        self.send_response(status)
        self._headers()
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__health':
            return self._json(200, {'ok': True})
        if path == '/api/gemini.php':
            token = secrets.token_hex(32)
            cookie = f'nutrition_ai_csrf={token}; Path=/; SameSite=Lax'
            return self._json(200, {
                'ok': True,
                'version': 'v5.3.210-rc2',
                'protocol_version': 'nutrition-ai-comprehensive-planner-v7',
                'configured': True,
                'ai_available': False,
                'availability_code': 'ci_mock_provider_disabled',
                'retry_after_seconds': 0,
                'csrf_token': token,
                'limits': {'max_images': 4, 'max_image_bytes': 7340032, 'max_audio_bytes': 7340032}
            }, cookie)
        if self._denied(path):
            return self.send_error(404)
        return super().do_GET()

    def do_HEAD(self):
        path = urlsplit(self.path).path
        if self._denied(path) or path.startswith('/api/'):
            return self.send_error(404)
        return super().do_HEAD()

    def do_POST(self):
        path = urlsplit(self.path).path
        if path != '/api/gemini.php':
            return self.send_error(404)
        token = self.headers.get('X-Nutrition-CSRF', '')
        cookies = http.cookies.SimpleCookie(self.headers.get('Cookie', ''))
        expected = cookies.get('nutrition_ai_csrf')
        if not expected or not secrets.compare_digest(token, expected.value):
            return self._json(403, {'ok': False, 'error_code': 'csrf_failed', 'error': 'CSRF check failed'})
        return self._json(503, {
            'ok': False, 'retryable': False, 'error_code': 'ci_mock_provider_disabled',
            'error': 'External AI is disabled in browser CI.'
        })

    def _denied(self, raw_path):
        decoded = unquote(raw_path)
        normalized = posixpath.normpath('/' + decoded.lstrip('/'))
        if any(normalized == p or normalized.startswith(p + '/') for p in DENIED_PREFIXES):
            return True
        name = Path(normalized).name
        if name in DENIED_NAMES or name.startswith('.'):
            return True
        if normalized.endswith('.php'):
            return True
        return False

    def end_headers(self):
        # Static responses receive the same core headers as production.
        if not self._headers_buffer or not any(b'X-Content-Type-Options:' in h for h in self._headers_buffer):
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'same-origin')
            self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        super().end_headers()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default='.')
    ap.add_argument('--host', default='127.0.0.1')
    ap.add_argument('--port', type=int, default=4173)
    ns = ap.parse_args()
    root = Path(ns.root).resolve()
    os.chdir(root)
    httpd = ThreadingHTTPServer((ns.host, ns.port), Handler)
    print(f'CI server: http://{ns.host}:{ns.port} root={root}', flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    main()
