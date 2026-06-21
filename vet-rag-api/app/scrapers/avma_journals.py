from __future__ import annotations

from app.scrapers.avma_journals_crawl import AVMA_JOURNALS_HEADERS
from app.scrapers.avma_journals_extract import extract_avma_journal_article
from app.scrapers.http_client import fetch_url_safe


def scrape_avma_journal(url: str, *, delay_s: float = 1.5) -> dict:
    got = fetch_url_safe(url, delay_s=delay_s, headers=AVMA_JOURNALS_HEADERS)
    if not got:
        raise RuntimeError(f"AVMA journal fetch failed: {url}")
    body, ctype = got
    if ctype and "pdf" in ctype:
        raise ValueError(f"URL returned PDF; not supported for AVMA journals HTML: {url}")
    html = body.decode("utf-8", errors="replace")
    parsed = extract_avma_journal_article(html, url=url)
    if not parsed:
        raise ValueError(f"URL is not a parseable AVMA journal article: {url}")
    return {
        "url": parsed["url"],
        "title": parsed["title"],
        "raw_text": parsed["raw_text"],
        "source_type": "avma_journal",
        "species": parsed.get("species") or "dog",
        "min_words": 100,
    }
