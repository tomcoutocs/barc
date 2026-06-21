from __future__ import annotations

import logging
import re
from collections import deque
from collections.abc import Callable
from urllib.parse import urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup

from app.scrapers.avma_journals_extract import (
    extract_avma_journal_article,
    infer_species_from_text,
    is_avma_journal_article_url,
)
from app.scrapers.http_client import fetch_url_safe
from app.utils.deduper import content_fingerprint

logger = logging.getLogger(__name__)

HOST = "avmajournals.avma.org"

AVMA_JOURNALS_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://avmajournals.avma.org/",
}

_SKIP_PATH_PREFIXES = (
    "/page/JAVMA-instructions",
    "/page/AJVR-instructions",
    "/page/reviewer",
    "/page/peer-review",
    "/page/plagiarism",
    "/page/Editorial-Board",
    "/page/JAVMA-advertising",
    "/page/ai-guidelines",
)


def _canonical_url(href: str, base: str) -> str | None:
    full = urljoin(base, href)
    p = urlparse(full)
    host = (p.netloc or "").lower()
    if HOST not in host:
        return None
    path = p.path or "/"
    low_path = path.lower()
    if ":" in path or "/configurable/" in low_path:
        return None
    if any(low_path.startswith(x) for x in _SKIP_PATH_PREFIXES):
        return None
    if path.endswith((".jpg", ".png", ".gif", ".css", ".js", ".pdf")):
        return None
    return urlunparse(("https", HOST, path.rstrip("/") or "/", "", "", ""))


def _mentions_dog_or_cat(text: str) -> bool:
    return infer_species_from_text(text) is not None


def _norm_title(title: str) -> str:
    return " ".join(title.lower().split())


def _default_seeds() -> list[str]:
    """Entry points discovered from the live site — no guessed issue URLs."""
    return [
        "https://avmajournals.avma.org/",
        "https://avmajournals.avma.org/view/journals/javma/javma-overview.xml",
        "https://avmajournals.avma.org/view/journals/ajvr/ajvr-overview.xml",
        "https://avmajournals.avma.org/page/Currents-in-One-Health-Collection",
        # Recent supplemental / issue hubs (linked from homepage)
        "https://avmajournals.avma.org/view/journals/javma/263/S1/javma.263.issue-S1.xml",
        "https://avmajournals.avma.org/view/journals/javma/263/S2/javma.263.issue-S2.xml",
        "https://avmajournals.avma.org/view/journals/javma/262/S1/javma.262.issue-S1.xml",
        "https://avmajournals.avma.org/view/journals/ajvr/86/S1/ajvr.86.issue-S1.xml",
    ]


def _enqueue_url(
    q: deque[str],
    enqueued: set[str],
    visited: set[str],
    url: str,
    *,
    priority: bool = False,
) -> None:
    if url in visited or url in enqueued:
        return
    enqueued.add(url)
    if priority:
        q.appendleft(url)
    else:
        q.append(url)


def _url_priority(url: str) -> bool:
    low = url.lower()
    if "/doi/10.2460/" in low:
        return True
    return bool(
        re.search(
            r"/view/journals/(?:javma|ajvr)/[^/]+/[^/]+/(?:javma|ajvr)\.\d+\.\d+\.\d+\.xml",
            low,
        )
    )


def _is_duplicate_article(
    parsed: dict,
    *,
    seen_dois: set[str],
    seen_titles: set[str],
    seen_fingerprints: set[str],
) -> bool:
    doi = (parsed.get("doi") or "").strip().lower()
    title_key = _norm_title(parsed.get("title") or "")
    fp = content_fingerprint(parsed.get("raw_text") or "")
    if doi and doi in seen_dois:
        return True
    if title_key and title_key in seen_titles:
        return True
    if fp in seen_fingerprints:
        return True
    return False


def _remember_article(
    parsed: dict,
    *,
    seen_dois: set[str],
    seen_titles: set[str],
    seen_fingerprints: set[str],
    seen_urls: set[str],
) -> None:
    doi = (parsed.get("doi") or "").strip().lower()
    title_key = _norm_title(parsed.get("title") or "")
    fp = content_fingerprint(parsed.get("raw_text") or "")
    url = parsed.get("url") or ""
    if doi:
        seen_dois.add(doi)
    if title_key:
        seen_titles.add(title_key)
    seen_fingerprints.add(fp)
    if url:
        seen_urls.add(url)


def crawl_avma_journals(
    seeds: list[str] | None = None,
    *,
    max_articles: int = 2500,
    max_visits: int = 35000,
    delay_s: float = 2.5,
    require_dog_or_cat: bool = True,
    on_article: Callable[[dict], None] | None = None,
) -> list[dict]:
    """
    Breadth-first crawl of avmajournals.avma.org (JAVMA / AJVR).

    Collects article title + abstract (+ keywords) from PubFactory pages.
    When ``require_dog_or_cat`` is True (default), skips articles that do not
    mention dogs or cats in title/abstract/keywords.
    """
    if seeds is None:
        seeds = _default_seeds()

    seeds_n: list[str] = []
    for s in seeds:
        c = _canonical_url(s, s)
        if c:
            seeds_n.append(c)
    if not seeds_n:
        seeds_n = [f"https://{HOST}/"]

    articles: list[dict] = []
    seen_urls: set[str] = set()
    seen_dois: set[str] = set()
    seen_titles: set[str] = set()
    seen_fingerprints: set[str] = set()
    skipped_duplicates = 0
    visited: set[str] = set()
    enqueued: set[str] = set()
    q: deque[str] = deque()
    for s in seeds_n:
        if s not in enqueued:
            enqueued.add(s)
            q.append(s)

    visits = 0
    while q and len(articles) < max_articles and visits < max_visits:
        url = q.popleft()
        if url in visited:
            continue
        visited.add(url)
        visits += 1
        if visits % 20 == 0:
            logger.info(
                "avma journals crawl: visits=%s articles=%s queue=%s",
                visits,
                len(articles),
                len(q),
            )

        got = fetch_url_safe(url, delay_s=delay_s, headers=AVMA_JOURNALS_HEADERS)
        if not got:
            continue
        body, ctype = got
        if ctype and "pdf" in ctype:
            continue
        html = body.decode("utf-8", errors="replace")

        if is_avma_journal_article_url(url) and len(articles) < max_articles:
            parsed = extract_avma_journal_article(html, url=url)
            if parsed:
                if require_dog_or_cat and not _mentions_dog_or_cat(parsed.get("raw_text") or ""):
                    logger.debug("avma journals: skip non dog/cat article url=%s", url)
                elif _is_duplicate_article(
                    parsed,
                    seen_dois=seen_dois,
                    seen_titles=seen_titles,
                    seen_fingerprints=seen_fingerprints,
                ):
                    skipped_duplicates += 1
                    logger.debug("avma journals: skip duplicate doi/title/content url=%s", url)
                else:
                    art_url = parsed["url"]
                    if art_url not in seen_urls:
                        _remember_article(
                            parsed,
                            seen_dois=seen_dois,
                            seen_titles=seen_titles,
                            seen_fingerprints=seen_fingerprints,
                            seen_urls=seen_urls,
                        )
                        species = parsed.get("species") or "dog"
                        doc = {
                            "url": art_url,
                            "title": parsed["title"],
                            "raw_text": parsed["raw_text"],
                            "source_type": "avma_journal",
                            "species": species,
                            "min_words": 100,
                        }
                        articles.append(doc)
                        if on_article:
                            on_article(doc)

        soup = BeautifulSoup(html, "lxml")
        for a in soup.find_all("a", href=True):
            child = _canonical_url(a["href"], url)
            if not child:
                continue
            _enqueue_url(q, enqueued, visited, child, priority=_url_priority(child))

        for m in re.finditer(
            r'href="(/doi/10\.2460/(?:javma|ajvr)\.[^"]+|/view/journals/(?:javma|ajvr)/[^"]+\.xml)"',
            html,
            re.I,
        ):
            child = _canonical_url(m.group(1), url)
            if child:
                _enqueue_url(q, enqueued, visited, child, priority=_url_priority(child))

    logger.info(
        "avma journals crawl: done visits=%s enqueued=%s articles=%s skipped_duplicates=%s",
        visits,
        len(enqueued),
        len(articles),
        skipped_duplicates,
    )
    return articles
