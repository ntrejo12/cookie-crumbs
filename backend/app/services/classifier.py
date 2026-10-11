import json
import os
from functools import lru_cache
from pathlib import Path

import tldextract

from app.schemas.ai import ObservedDomain, TrackerClassification

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "tracker_domains.json"

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
        name=base,
        company=entry.get("company"),           
        category=cat,
        risk_level=CATEGORY_RISK.get(cat, "unknown"),
        confidence=1.0,
        source="known_list",
        verified=True,
        explanation=entry.get("description"),   
    )


def _from_heuristics(domain: str) -> TrackerClassification | None:
    d = domain.lower()

    for cat, words in HEURISTICS.items():
        if any(word in d for word in words):
            return TrackerClassification(
                name=domain,
                category=cat,
                risk_level=CATEGORY_RISK.get(cat, "unknown"),
                confidence=0.55,
                source="heuristic",
                verified=False,
                explanation=(
                    f"The domain name contains terms associated with "
                    f"{cat} services. This is an unverified estimate."
                ),
            )

    return None


@lru_cache(maxsize=1)
def _zero_shot():
    from transformers import pipeline

    return pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
    )


def _from_model(obs: ObservedDomain) -> TrackerClassification:
    description = (
        f"Domain: {obs.domain}. "
        f"Resource types: {', '.join(obs.resource_types) or 'unknown'}. "
        f"Observed requests: {obs.request_count}. "
        f"Cookie count: {obs.cookie_count}."
    )

    output = _zero_shot()(
        description,
        candidate_labels=list(MODEL_LABELS.keys()),
        hypothesis_template="This network service is used for {}.",
    )

    label = output["labels"][0]
    score = float(output["scores"][0])

    category = MODEL_LABELS[label] if score >= 0.45 else "unknown"

    return TrackerClassification(
        name=obs.domain,
        category=category,
        risk_level=CATEGORY_RISK.get(category, "unknown"),
        confidence=round(score, 2),
        source="model",
        verified=False,
        explanation=(
            f"The Hugging Face model estimates this domain may be "
            f"used for {label}. This prediction is based only on "
            f"limited request metadata and is not verified."
            if category != "unknown"
            else "The model could not identify a likely service category."
        ),
    )


def classify(obs: ObservedDomain) -> TrackerClassification:
    base = registrable(obs.domain)

    known = _from_known(base)

    if known is not None:
        return known.model_copy(
            update={"name": obs.domain}
        )

    # A model prediction should be preferred over a
    # domain-name heuristic when the model is available.
    if os.getenv("ENABLE_MODEL", "false").lower() == "true":
        try:
            return _from_model(obs)
        except Exception:
            import logging
            logging.getLogger(__name__).exception(
                "Hugging Face classification failed for %s",
                obs.domain,
            )

    heuristic = _from_heuristics(obs.domain)

    if heuristic is not None:
        return heuristic

    return TrackerClassification(
        name=obs.domain,
        category="unknown",
        risk_level="unknown",
        source=None,
        verified=False,
        explanation="No reliable classification is available.",
    )


def classify_many(
    domains: list[ObservedDomain],
) -> list[TrackerClassification]:
    return [
        classify(domain).model_copy(
            update={"request_count": domain.request_count}
        )
        for domain in domains
    ]


def classify_aggregated(
    domains: list[ObservedDomain],
) -> list[TrackerClassification]:
    merged: dict[str, TrackerClassification] = {}

    for domain in domains:
        classification = classify(domain)
        key = classification.name

        if key in merged:
            previous = merged[key]
            merged[key] = previous.model_copy(
                update={
                    "request_count": (
                        previous.request_count + domain.request_count
                    )
                }
            )
        else:
            merged[key] = classification.model_copy(
                update={"request_count": domain.request_count}
            )

    return list(merged.values())
