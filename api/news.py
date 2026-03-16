"""
api/news.py — Vercel Python Serverless Function
Route: /api/news?q=<query>&count=<n>
Fetches Google News RSS server-side and returns JSON.
No external dependencies — Python stdlib only.
"""

import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET

def handler(request):
    """Vercel serverless handler."""

    # Parse query params
    parsed = urllib.parse.urlparse(request.url)
    params = urllib.parse.parse_qs(parsed.query)
    query  = params.get("q", [""])[0].strip()
    count  = int(params.get("count", ["15"])[0])

    if not query:
        return Response(
            json.dumps({"error": "missing q parameter"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    try:
        items = fetch_news(query, count)
        body  = json.dumps({"status": "ok", "items": items}, ensure_ascii=False)
        return Response(body, status=200, headers={
            "Content-Type":                "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
        })
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            headers={"Content-Type": "application/json"},
        )


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
    req = urllib.request.Request(url, headers=headers)
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
