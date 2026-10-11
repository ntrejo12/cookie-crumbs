import hashlib
import json
import logging
import os
import re
from collections import Counter

from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse
from app.services.privacy_knowledge import (
    CATEGORY_KNOWLEDGE,
    GENERAL_PROTECTIONS,
    PERMISSION_KNOWLEDGE,
)

logger = logging.getLogger("cookie-crumbs.ai")

MAX_TRACKERS_TO_MODEL = 15
_cache: dict[str, AIAnalysisResponse] = {}  

SYSTEM_PROMPT = """You are Cookie Crumbs' privacy guide. You explain website tracking to everyday people in plain, calm English.

Rules:
- Use ONLY the FACTS and BACKGROUND provided. Do not invent companies, numbers or data types.
- Describe what trackers CAN or MAY do. Never say a site is spying, malicious or acting illegally.
- If a tracker has verified=false, say its label is an estimate and may be wrong.
- No jargon and no scare language. Be concise.
- Protections must be practical steps the person can take, based on BACKGROUND.
- Reply with ONE JSON object and nothing else, using exactly these keys:
{"explanation": "2-4 sentences", "data_collected": ["..."], "possible_uses": ["..."], "protections": ["..."], "uncertainty_note": "one sentence"}"""


def build_facts(req: AIAnalysisRequest) -> dict:
    ranked = sorted(req.trackers, key=lambda t: t.request_count, reverse=True)
    categories = Counter((t.category or "unknown") for t in req.trackers)
    return {
        "website": req.website,
        "tracker_count": len(req.trackers),
        "category_counts": dict(categories),
        "unverified_count": sum(1 for t in req.trackers if not t.verified),
        "cookie_count": req.cookie_count,
        "third_party_request_count": req.third_party_request_count,
        "permissions": req.permissions,
        "top_trackers": [
            {
                "domain": t.name,
                "company": t.company,
                "category": t.category or "unknown",
                "verified": t.verified,
                "confidence": t.confidence,
                "requests": t.request_count,
            }
            for t in ranked[:MAX_TRACKERS_TO_MODEL]
        ],
    }


def knowledge_for(facts: dict) -> dict:
    cats = {c: CATEGORY_KNOWLEDGE.get(c, CATEGORY_KNOWLEDGE["unknown"])
            for c in facts["category_counts"]}
    perms = {p: PERMISSION_KNOWLEDGE[p] for p in facts["permissions"]
             if p in PERMISSION_KNOWLEDGE}
    return {"categories": cats, "permissions": perms, "general": GENERAL_PROTECTIONS}


def _dedupe(items: list[str], limit: int) -> list[str]:
    seen, out = set(), []
    for i in items:
        if i and i not in seen:
            seen.add(i)
            out.append(i)
    return out[:limit]


# ---------- deterministic fallback ----------

def _risk_level(facts: dict) -> str:
    counts = facts["category_counts"]
    heavy = counts.get("advertising", 0) + counts.get("fingerprinting", 0)
    if heavy >= 3:
        return "high"
    if heavy or counts.get("social") or counts.get("analytics"):
        return "medium"
    return "low"


def _template(req: AIAnalysisRequest, facts: dict, knowledge: dict) -> AIAnalysisResponse:
    site = facts["website"] or "This page"
    parts = [f"{n} {c}" for c, n in facts["category_counts"].items()]
    explanation = f"{site} contacted {facts['tracker_count']} tracking-related services"
    explanation += f" ({', '.join(parts)})." if parts else "."
    if facts["cookie_count"]:
        explanation += f" It also stored {facts['cookie_count']} cookies."

    data, uses, prot = [], [], []
    for k in knowledge["categories"].values():
        data += k["data_collected"]
        uses += k["possible_uses"]
        prot += k["protections"]
    for perm, meaning in knowledge["permissions"].items():
        data.append(f"the {perm} permission means the site {meaning}")
    prot += knowledge["general"]
    prot = _dedupe(prot, 6)

    note = None
    if facts["unverified_count"]:
        note = (f"{facts['unverified_count']} of these services are not in our known "
                "tracker list, so their labels are estimates and may be wrong.")
    return AIAnalysisResponse(
        explanation=explanation,
        risk_summary=f"Overall tracking exposure: {_risk_level(facts)}.",
        data_collected=_dedupe(data, 8),
        possible_uses=_dedupe(uses, 6),
        protections=prot,
        recommendations=prot,
        uncertainty_note=note,
        tracker_classifications=req.trackers,
        generated_by="template",
    )


def _parse_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in model output")
    return json.loads(text[start:end + 1])


def _as_str_list(value, limit: int) -> list[str]:
    if not isinstance(value, list):
        return []
    return _dedupe([str(v).strip() for v in value if isinstance(v, (str, int, float))], limit)


def _call_model(facts: dict, knowledge: dict) -> dict:
    from huggingface_hub import InferenceClient

    client = InferenceClient(token=os.environ["HF_TOKEN"], timeout=30)
    model = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
    user = (
        "FACTS:\n" + json.dumps(facts, indent=2)
        + "\n\nBACKGROUND:\n" + json.dumps(knowledge, indent=2)
        + "\n\nWrite the JSON now."
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT},
                  {"role": "user", "content": user}],
        max_tokens=700,
        temperature=0.3,
    )
    return _parse_json(resp.choices[0].message.content)


def analyze(req: AIAnalysisRequest) -> AIAnalysisResponse:
    facts = build_facts(req)
    key = hashlib.sha256(json.dumps(facts, sort_keys=True).encode()).hexdigest()
    if key in _cache:
        return _cache[key]

    knowledge = knowledge_for(facts)
    base = _template(req, facts, knowledge)

    if os.getenv("HF_TOKEN"):
        try:
            out = _call_model(facts, knowledge)
            explanation = str(out.get("explanation", "")).strip()
            if explanation:
                protections = _as_str_list(out.get("protections"), 6) or base.protections
                base = base.model_copy(update={
                    "explanation": explanation,
                    "data_collected": _as_str_list(out.get("data_collected"), 8) or base.data_collected,
                    "possible_uses": _as_str_list(out.get("possible_uses"), 6) or base.possible_uses,
                    "protections": protections,
                    "recommendations": protections,
                    "uncertainty_note": str(out.get("uncertainty_note") or "").strip() or base.uncertainty_note,
                    "generated_by": "model",
                })
        except Exception as exc:       # quota, timeout, bad JSON... use the template
            logger.warning("HF call failed, using template: %s", exc)

    _cache[key] = base
    return base