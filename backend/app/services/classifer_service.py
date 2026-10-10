# app/services/classifier.py
import json
import os
from functools import lru_cache
from pathlib import Path

import tldextract

from app.schemas.ai import TrackerClassification
from app.schemas.scan import ObservedDomain

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "trackers.json"

# offline-safe: bundled public-suffix snapshot, no network fetch
_extract = tldextract.TLDExtract(suffix_list_urls=())

CATEGORY_RISK = {
    "advertising": "high", "fingerprinting": "high",
    "social": "medium", "analytics": "medium",
    "cdn": "low", "functional": "low",
}

HEURISTICS = {
    "advertising": ["ads", "adserver", "adsystem", "doubleclick", "pixel", "banner"],
    "analytics":   ["analytics", "metrics", "stats", "telemetry", "beacon", "track"],
    "cdn":         ["cdn", "static", "assets", "cache"],
}

MODEL_LABELS = {
    "online advertising": "advertising",
    "web analytics": "analytics",
    "social media": "social",
    "content delivery network": "cdn",
    "website functionality": "functional",
}

_cache: dict[str, TrackerClassification] = {}


@lru_cache
def _known() -> dict:
    return json.loads(DATA_PATH.read_text())


def registrable(domain: str) -> str:
    return _extract(domain).registered_domain or domain.lower()


def _from_known(base: str) -> TrackerClassification | None:
    entry = _known().get(base)
    if not entry:
        return None
    cat = entry["category"]
    return TrackerClassification(
        name=base, company=entry["company"], category=cat,
        risk_level=CATEGORY_RISK.get(cat, "unknown"),
        confidence=1.0, source="known_list", verified=True,
    )


def _from_heuristics(domain: str) -> TrackerClassification | None:
    d = domain.lower()
    for cat, words in HEURISTICS.items():
        if any(w in d for w in words):
            return TrackerClassification(
                name=registrable(domain), category=cat,
                risk_level=CATEGORY_RISK.get(cat, "unknown"),
                confidence=0.55, source="heuristic", verified=False,
            )
    return None


@lru_cache
def _zero_shot():
    from transformers import pipeline  # lazy: slow import, big model
    return pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


def _from_model(obs: ObservedDomain) -> TrackerClassification:
    text = (f"Network domain {obs.domain}. Resource types: "
            f"{', '.join(obs.resource_types) or 'unknown'}. "
            f"{obs.request_count} requests, sets {obs.cookie_count} cookies.")
    out = _zero_shot()(text, list(MODEL_LABELS), hypothesis_template="This domain is used for {}.")
    label, score = out["labels"][0], float(out["scores"][0])
    if score < 0.45:
        return TrackerClassification(name=registrable(obs.domain), category="unknown",
                                     risk_level="unknown", confidence=score,
                                     source="model", verified=False)
    cat = MODEL_LABELS[label]
    return TrackerClassification(
        name=registrable(obs.domain), category=cat,
        risk_level=CATEGORY_RISK.get(cat, "unknown"),
        confidence=round(score, 2), source="model", verified=False,
    )


def classify(obs: ObservedDomain) -> TrackerClassification:
    base = registrable(obs.domain)
    if base in _cache:
        return _cache[base]

    result = (_from_known(base) or _from_heuristics(obs.domain))
    if result is None:
        if os.getenv("ENABLE_MODEL", "true").lower() == "true":
            result = _from_model(obs)
        else:
            result = TrackerClassification(name=base, category="unknown",
                                           risk_level="unknown", source="heuristic")
    _cache[base] = result
    return result


def classify_many(domains: list[ObservedDomain]) -> list[TrackerClassification]:
    return [classify(d) for d in domains]