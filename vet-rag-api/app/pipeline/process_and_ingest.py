from __future__ import annotations

import logging

from app.pipeline.ingest_documents import ingest_documents
from app.utils.cleaner import clean_text
from app.utils.deduper import ContentDeduper
from app.utils.metadata import enrich_metadata

logger = logging.getLogger(__name__)


def process_and_ingest(scraped_docs: list[dict], *, min_words: int = 300) -> int:
    """
    For each scraped payload: clean → dedupe (hash + min word count) → enrich metadata → ingest.

    Returns count of documents successfully passed to ingest_documents.
    """
    deduper = ContentDeduper(min_words=min_words)
    ingested = 0
    for raw in scraped_docs:
        url = raw.get("url") or ""
        raw_text = raw.get("raw_text") or ""
        title = raw.get("title") or ""
        source_type = raw.get("source_type") or "merck"
        species_raw = raw.get("species")
        species = str(species_raw).strip().lower() if species_raw else "dog"
        doc_min_words = raw.get("min_words")
        if doc_min_words is not None:
            try:
                doc_min_words = int(doc_min_words)
            except (TypeError, ValueError):
                doc_min_words = min_words
        else:
            doc_min_words = 100 if source_type == "avma_journal" else min_words
        text = clean_text(raw_text)
        if not deduper.accept(text, min_words=doc_min_words):
            logger.info("process_and_ingest: skip (short or duplicate) url=%s", url)
            continue
        meta = enrich_metadata(
            text,
            source=url,
            title=title,
            source_type=str(source_type),
            species=species,
        )
        ingest_documents([{"text": text, "metadata": meta}])
        ingested += 1
    return ingested
