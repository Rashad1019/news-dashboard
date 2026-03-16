"""
server.py — MultiAgent News Analyst backend
Serves static files + /api/news?q=query endpoint
No external dependencies — uses Python stdlib only
"""

import http.server
import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
import os
import mimetypes
import sys

PORT    = 5500
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Fetch + parse Google News RSS ────────────────────────────────────
def fetch_news(query: str, count: int = 15) -> list:
    encoded = urllib.parse.quote(query)
    url     = (
        f"https://news.google.com/rss/search"
        f"?q={encoded}&hl=en-US&gl=US&ceid=US:en"
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )
    }
    req  = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw = resp.read()

    root  = ET.fromstring(raw)
    items = []
    for item in root.findall(".//item")[:count]:
        title   = item.findtext("title",   default="").strip()
        link    = item.findtext("link",    default="").strip()
        pubDate = item.findtext("pubDate", default="").strip()
        source_el = item.find("source")
        source  = source_el.text.strip() if source_el is not None else "Google News"
        if title:
            items.append({
                "title":   title,
                "link":    link,
                "pubDate": pubDate,
                "source":  source,
            })
    return items


# ── HTTP Handler ─────────────────────────────────────────────────────
class Handler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # Suppress noisy log; only print errors
        if int(args[1]) >= 400:
            print(f"  [{args[1]}] {args[0]}", file=sys.stderr)

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type",  "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path):
        mime, _ = mimetypes.guess_type(path)
        mime = mime or "application/octet-stream"
        try:
            with open(path, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type",   mime)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control",  "no-cache")
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self.send_error(404, "Not Found")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # ── API endpoint ──────────────────────────────────────────
        if path == "/api/news":
            query = params.get("q", [""])[0].strip()
            count = int(params.get("count", ["15"])[0])
            if not query:
                self._send_json({"error": "missing q parameter"}, 400)
                return
            try:
                items = fetch_news(query, count)
                self._send_json({"status": "ok", "items": items})
                print(f"  [API] '{query}' → {len(items)} results")
            except Exception as e:
                print(f"  [API ERROR] {e}", file=sys.stderr)
                self._send_json({"error": str(e)}, 500)
            return

        # ── Static files ──────────────────────────────────────────
        if path == "/" or path == "":
            path = "/index.html"

        file_path = os.path.join(BASE_DIR, path.lstrip("/"))
        # Safety: keep within BASE_DIR
        if not os.path.abspath(file_path).startswith(BASE_DIR):
            self.send_error(403, "Forbidden")
            return

        if os.path.isfile(file_path):
            self._send_file(file_path)
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ── Main ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("", PORT), Handler) as srv:
        print(f"\n  ✦ MultiAgent News server running")
        print(f"  ✦ Open → http://localhost:{PORT}")
        print(f"  ✦ API  → http://localhost:{PORT}/api/news?q=your+topic")
        print(f"\n  Press Ctrl+C to stop.\n")
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
