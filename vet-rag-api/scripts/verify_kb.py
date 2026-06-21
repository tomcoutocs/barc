"""Verify knowledge base includes AVMA journal chunks."""
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

from app.agent.rag_client import retrieve_context, retrieve_context_deep
from app.config import get_settings
from app.vectorstore.factory import get_vector_store


def main() -> None:
    settings = get_settings()
    store = get_vector_store(settings)
    stats = store._index.describe_index_stats()
    total = stats.get("total_vector_count", 0)
    print("=== Pinecone index stats ===")
    print(f"total_vectors: {total}")
    for k, v in (stats.get("namespaces") or {}).items():
        print(f"  namespace {k!r}: {v}")

    queries = [
        ("dog rabies vaccination failure", "dog"),
        ("cat atopic dermatitis environmental factors", "cat"),
        ("canine dilated cardiomyopathy diet", "dog"),
        ("feline chronic enteropathy", "cat"),
    ]

    print("\n=== Retrieval spot-check (top 8) ===")
    total_avma = 0
    total_journal = 0
    for q, sp in queries:
        hits = retrieve_context(q, species=sp, top_k=8)
        types = Counter((h.get("metadata") or {}).get("type") for h in hits)
        avma = sum(1 for h in hits if "avmajournals.avma.org" in (h.get("source") or ""))
        merck = sum(1 for h in hits if "merckvetmanual.com" in (h.get("source") or ""))
        total_avma += avma
        total_journal += types.get("journal", 0)
        print(f"Q: {q}")
        print(f"   types={dict(types)}  avma_urls={avma}  merck_urls={merck}")
        if hits:
            top = hits[0]
            md = top.get("metadata") or {}
            print(
                f"   top: score={top.get('score', 0):.3f} type={md.get('type')} "
                f"title={(md.get('title') or '')[:55]!r}"
            )
            print(f"        source={(top.get('source') or '')[:72]}")

    print("\n=== Deep retrieval (dog vomiting) ===")
    interp = {
        "normalized_query": "dog vomiting blood",
        "symptoms": ["vomiting"],
        "suspected_toxins": [],
        "duration": "2 days",
    }
    deep = retrieve_context_deep(interp, species="dog", top_k=8)
    types = Counter((h.get("metadata") or {}).get("type") for h in deep)
    avma = sum(1 for h in deep if "avmajournals.avma.org" in (h.get("source") or ""))
    print(f"hits={len(deep)} types={dict(types)} avma_urls={avma}")
    for h in deep[:4]:
        md = h.get("metadata") or {}
        print(f"  - {md.get('type')} | {(md.get('title') or '')[:50]} | {(h.get('source') or '')[:55]}")

    print("\n=== Summary ===")
    print(f"Index vectors: {total}")
    print(f"Journal-type hits across spot-checks: {total_journal}")
    print(f"AVMA URL hits across spot-checks: {total_avma}")
    if total_avma > 0 or total_journal > 0:
        print("OK: Agent knowledge base includes AVMA journal content.")
    else:
        print("WARN: No AVMA journal chunks in top retrieval results — may need broader queries.")


if __name__ == "__main__":
    main()
