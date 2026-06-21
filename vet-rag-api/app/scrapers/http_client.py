from __future__ import annotations

import logging
import time

import requests

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "VetRAGEducationalBot/1.0 (+https://example.invalid; respect robots.txt; contact: admin@localhost)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

_SESSION: requests.Session | None = None

# AVMA PubFactory rate-limits aggressive crawls; one gentle retry on overload.
_RATE_LIMIT_STATUSES = frozenset({429, 503})


def _session() -> requests.Session:
    global _SESSION
    if _SESSION is None:
        _SESSION = requests.Session()
        _SESSION.headers.update(DEFAULT_HEADERS)
    return _SESSION


def _get_once(
    url: str,
    *,
    timeout: float = 45.0,
    headers: dict[str, str] | None = None,
) -> requests.Response:
    return _session().get(url, timeout=timeout, headers=headers)


def fetch_url(
    url: str,
    *,
    timeout: float = 45.0,
    headers: dict[str, str] | None = None,
) -> tuple[bytes, str | None]:
    """Return (body, content_type). Raises on hard failure."""
    resp = _get_once(url, timeout=timeout, headers=headers)
    resp.raise_for_status()
    ctype = resp.headers.get("Content-Type", "").split(";")[0].strip().lower() or None
    return resp.content, ctype


def fetch_url_safe(
    url: str,
    *,
    delay_s: float = 0.0,
    headers: dict[str, str] | None = None,
    rate_limit_backoff_s: float = 6.0,
) -> tuple[bytes, str | None] | None:
    if delay_s > 0:
        time.sleep(delay_s)
    try:
        resp = _get_once(url, headers=headers)
        if resp.status_code in _RATE_LIMIT_STATUSES:
            logger.warning(
                "fetch rate-limited url=%s status=%s; backing off %.0fs",
                url,
                resp.status_code,
                rate_limit_backoff_s,
            )
            time.sleep(rate_limit_backoff_s)
            resp = _get_once(url, headers=headers)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        ctype = resp.headers.get("Content-Type", "").split(";")[0].strip().lower() or None
        return resp.content, ctype
    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else "?"
        logger.warning("fetch failed url=%s status=%s", url, status)
        return None
    except requests.RequestException as exc:
        logger.warning("fetch failed url=%s err=%s", url, exc)
        return None
