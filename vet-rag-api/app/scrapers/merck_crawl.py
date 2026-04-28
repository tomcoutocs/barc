from __future__ import annotations

import logging
from collections import deque
from urllib.parse import urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup

from app.scrapers.html_extract import extract_main_text
from app.scrapers.http_client import fetch_url_safe

logger = logging.getLogger(__name__)

HOST_MARKER = "merckvetmanual.com"

_SEGMENT_SPECIES: dict[str, str] = {
    "dog-owners": "dog",
    "cat-owners": "cat",
}


def _canonical_owner_url(href: str, base: str, segment: str) -> str | None:
    seg = segment.strip().strip("/").lower()
    full = urljoin(base, href)
    p = urlparse(full)
    host = (p.netloc or "").lower()
    if HOST_MARKER not in host:
        return None
    path = p.path or "/"
    prefix = "/" + seg
    if not path.lower().startswith(prefix):
        return None
    path_norm = "/" + "/".join(x for x in path.split("/") if x)
    if not path_norm.lower().startswith(prefix):
        return None
    return urlunparse(("https", "www.merckvetmanual.com", path_norm, "", p.query, ""))


def _path_is_article(path: str, segment: str) -> bool:
    parts = [x for x in (path or "").strip("/").split("/") if x]
    seg = segment.strip().strip("/").lower()
    return len(parts) >= 3 and parts[0].lower() == seg


def crawl_merck_owner_articles(
    seeds: list[str] | None = None,
    *,
    owner_segment: str = "dog-owners",
    max_articles: int = 200,
    max_visits: int = 4000,
    delay_s: float = 1.0,
) -> list[dict]:
    """
    Breadth-first crawl of merckvetmanual.com/<owner_segment>/* (e.g. dog-owners or cat-owners).
    Collects up to ``max_articles`` article pages (URL depth: /<segment>/<section>/<page>/...).
    Each dict includes ``species`` (dog or cat) for downstream metadata.
    """
    segment = owner_segment.strip().strip("/").lower()
    species = _SEGMENT_SPECIES.get(segment, "dog")

    if seeds is None:
        seeds = [f"https://www.merckvetmanual.com/{segment}"]

    seeds_n: list[str] = []
    for s in seeds:
        c = _canonical_owner_url(s, s, segment)
        if c:
            seeds_n.append(c)
        elif f"/{segment}" in s.lower():
            seeds_n.append(s.split("#")[0].rstrip("/") or f"https://www.merckvetmanual.com/{segment}")
    if not seeds_n:
        seeds_n = [f"https://www.merckvetmanual.com/{segment}"]

    articles: list[dict] = []
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
        if visits % 25 == 0:
            logger.info(
                "merck crawl [%s]: visits=%s articles=%s queue=%s",
                segment,
                visits,
                len(articles),
                len(q),
            )

        got = fetch_url_safe(url, delay_s=delay_s)
        if not got:
            continue
        body, ctype = got
        if ctype and "pdf" in ctype:
            continue
        html = body.decode("utf-8", errors="replace")
        path = urlparse(url).path
        if _path_is_article(path, segment) and len(articles) < max_articles:
            title, text = extract_main_text(html, url=url)
            if text.strip():
                articles.append(
                    {
                        "url": url,
                        "title": title or url,
                        "raw_text": text,
                        "source_type": "merck",
                        "species": species,
                    }
                )

        soup = BeautifulSoup(html, "lxml")
        for a in soup.find_all("a", href=True):
            child = _canonical_owner_url(a["href"], url, segment)
            if not child or child in visited:
                continue
            if child not in enqueued:
                enqueued.add(child)
                q.append(child)

    logger.info(
        "merck crawl [%s]: done visits=%s unique_enqueued=%s articles=%s",
        segment,
        visits,
        len(enqueued),
        len(articles),
    )
    return articles


def crawl_merck_dog_owner_articles(
    seeds: list[str] | None = None,
    *,
    max_articles: int = 200,
    max_visits: int = 4000,
    delay_s: float = 1.0,
) -> list[dict]:
    """Backward-compatible wrapper for dog-owner Merck crawl."""
    return crawl_merck_owner_articles(
        seeds,
        owner_segment="dog-owners",
        max_articles=max_articles,
        max_visits=max_visits,
        delay_s=delay_s,
    )
