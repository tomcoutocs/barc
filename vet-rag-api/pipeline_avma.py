"""
AVMA Journals only: crawl JAVMA/AJVR → process_and_ingest.

Usage (from vet-rag-api/, venv active):
  python pipeline_avma.py

Tune via .env.local:
  AVMA_JOURNALS_CRAWL_MAX_ARTICLES=2500
  AVMA_JOURNALS_CRAWL_MAX_VISITS=35000
  AVMA_JOURNALS_CRAWL_DELAY_S=2.5
  AVMA_JOURNALS_REQUIRE_DOG_OR_CAT=true
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.config import get_settings
from app.pipeline.process_and_ingest import process_and_ingest
from app.scrapers.avma_journals_crawl import crawl_avma_journals

LOG_PATH = _ROOT / "logs" / "pipeline_avma.log"
INGEST_BATCH = 25


class _FlushingFileHandler(logging.FileHandler):
    def emit(self, record: logging.LogRecord) -> None:
        super().emit(record)
        self.flush()


def _setup_logging() -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.INFO)

    # stdout — avoids PowerShell treating stderr INFO as errors
    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(fmt)
    root.addHandler(stream)

    file_handler = _FlushingFileHandler(LOG_PATH, mode="w", encoding="utf-8")
    file_handler.setFormatter(fmt)
    root.addHandler(file_handler)


def main() -> None:
    _setup_logging()
    settings = get_settings()
    log = logging.getLogger(__name__)
    log.info(
        "AVMA journals only: max_articles=%s max_visits=%s delay_s=%s require_dog_or_cat=%s",
        settings.avma_journals_crawl_max_articles,
        settings.avma_journals_crawl_max_visits,
        settings.avma_journals_crawl_delay_s,
        settings.avma_journals_require_dog_or_cat,
    )

    pending: list[dict] = []
    ingested_total = 0

    def flush_pending() -> None:
        nonlocal ingested_total
        if not pending:
            return
        batch = pending[:]
        pending.clear()
        n = process_and_ingest(batch, min_words=300)
        ingested_total += n
        log.info("Ingested batch of %s document(s); running total=%s", n, ingested_total)

    def on_article(doc: dict) -> None:
        pending.append(doc)
        if len(pending) >= INGEST_BATCH:
            flush_pending()

    docs = crawl_avma_journals(
        max_articles=settings.avma_journals_crawl_max_articles,
        max_visits=settings.avma_journals_crawl_max_visits,
        delay_s=settings.avma_journals_crawl_delay_s,
        require_dog_or_cat=settings.avma_journals_require_dog_or_cat,
        on_article=on_article,
    )
    flush_pending()
    log.info("Collected %s AVMA journal article(s)", len(docs))
    log.info("AVMA pipeline finished; ingested %s document(s)", ingested_total)


if __name__ == "__main__":
    main()
