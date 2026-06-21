from __future__ import annotations

import re
from typing import Any

from bs4 import BeautifulSoup

_DOI_RE = re.compile(r"10\.2460/(?:javma|ajvr)\.[\d.]+", re.I)
_DOG_RE = re.compile(r"\b(dog|dogs|canine|puppy|puppies)\b", re.I)
_CAT_RE = re.compile(r"\b(cat|cats|feline|kitten|kittens)\b", re.I)


def infer_species_from_text(text: str) -> str | None:
    """Return dog, cat, or None when neither species is mentioned."""
    has_dog = bool(_DOG_RE.search(text))
    has_cat = bool(_CAT_RE.search(text))
    if has_dog and not has_cat:
        return "dog"
    if has_cat and not has_dog:
        return "cat"
    if has_dog and has_cat:
        dog_n = len(_DOG_RE.findall(text))
        cat_n = len(_CAT_RE.findall(text))
        return "dog" if dog_n >= cat_n else "cat"
    return None


def is_avma_journal_article_url(url: str) -> bool:
    low = url.lower()
    if "/doi/10.2460/" in low:
        return bool(_DOI_RE.search(low))
    return bool(
        re.search(
            r"/view/journals/(?:javma|ajvr)/[^/]+/[^/]+/(?:javma|ajvr)\.\d+\.\d+\.\d+\.xml",
            low,
        )
    )


def _meta_content(soup: BeautifulSoup, name: str) -> str:
    el = soup.find("meta", attrs={"name": name})
    if not el:
        return ""
    return (el.get("content") or "").strip()


def _abstract_text(soup: BeautifulSoup) -> str:
    for sel in (
        "meta[name='citation_abstract']",
        ".abstract",
        "#abstract",
        "[class*='abstract']",
        "section[data-type='abstract']",
    ):
        el = soup.select_one(sel)
        if not el:
            continue
        text = (el.get("content") or el.get_text(" ", strip=True)).strip()
        text = re.sub(r"^abstract\s*:?\s*", "", text, flags=re.I)
        if len(text) > 80:
            return text
    return ""


def _keywords_text(soup: BeautifulSoup) -> str:
    parts: list[str] = []
    for el in soup.find_all("meta", attrs={"name": "citation_keywords"}):
        val = (el.get("content") or "").strip()
        if val:
            parts.append(val)
    return "; ".join(parts)


def extract_avma_journal_article(html: str, *, url: str) -> dict[str, Any] | None:
    """
    Parse a JAVMA/AJVR PubFactory article page.

    Most articles expose at least title + abstract publicly; full text is often paywalled.
    Returns None when the page does not look like an article or has no usable abstract.
    """
    if not is_avma_journal_article_url(url):
        return None

    soup = BeautifulSoup(html, "lxml")
    title = _meta_content(soup, "citation_title")
    if not title:
        h1 = soup.find("h1")
        title = h1.get_text(" ", strip=True) if h1 else ""

    doi = _meta_content(soup, "citation_doi")
    if not doi:
        m = _DOI_RE.search(url)
        doi = m.group(0) if m else ""

    abstract = _abstract_text(soup)
    keywords = _keywords_text(soup)
    journal = _meta_content(soup, "citation_journal_title")

    sections: list[str] = []
    if title:
        sections.append(title)
    if journal:
        sections.append(f"Journal: {journal}")
    if doi:
        sections.append(f"DOI: {doi}")
    if abstract:
        sections.append(f"\nAbstract\n{abstract}")
    if keywords:
        sections.append(f"\nKeywords\n{keywords}")

    raw_text = "\n\n".join(sections).strip()
    if not raw_text:
        return None

    species = infer_species_from_text(f"{title}\n{abstract}\n{keywords}")
    canonical = f"https://avmajournals.avma.org/doi/{doi}" if doi else url.split("#")[0]

    return {
        "url": canonical,
        "title": title or canonical,
        "raw_text": raw_text,
        "source_type": "avma_journal",
        "species": species,
        "doi": doi,
    }
