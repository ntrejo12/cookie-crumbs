from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session, joinedload

from app.db.models import Scan, ScanTracker, Tracker, Website
from app.schemas.history import InsightsResponse, ScanSaveRequest


def normalize_domain(value: str) -> str:
    value = value.strip().lower()
    if "://" in value:
        value = urlparse(value).hostname or value
    value = value.split("/")[0]
    return value[4:] if value.startswith("www.") else value


def list_scans(db: Session, user_id: str, limit: int = 20, offset: int = 0,
               domain: str | None = None) -> list[Scan]:
    q = (
        db.query(Scan)
        .options(joinedload(Scan.website))
        .filter(Scan.user_id == user_id)
    )
    if domain:
        q = q.join(Scan.website).filter(Website.domain == normalize_domain(domain))
    return q.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()


def get_scan(db: Session, user_id: str, scan_id: int) -> Scan | None:
    return (
        db.query(Scan)
        .options(joinedload(Scan.website))
        .filter(Scan.id == scan_id, Scan.user_id == user_id)
        .first()
    )


def delete_scan(db: Session, user_id: str, scan_id: int) -> bool:
    scan = get_scan(db, user_id, scan_id)
    if scan is None:
        return False
    db.delete(scan)          
    db.commit()
    return True


def delete_all(db: Session, user_id: str) -> int:
    scans = db.query(Scan).filter(Scan.user_id == user_id).all()
    for scan in scans:      
        db.delete(scan)
    db.commit()
    return len(scans)


TRACKER_WEIGHTS = {"advertising": 8, "fingerprinting": 10, "social": 5,
                   "analytics": 4, "unknown": 2}


def estimate_privacy_score(body: ScanSaveRequest) -> int:
    """Simple, explainable placeholder: start at 100 and subtract.
    Swap for the team's real scoring if privacy_service.py already has one."""
    score = 100
    for t in body.trackers:
        score -= TRACKER_WEIGHTS.get(t.category or "unknown", 0)
    score -= min(body.cookie_count, 40) // 4
    score -= min(body.permission_count, 5) * 2
    return max(0, min(100, score))


def _get_or_create_website(db: Session, domain: str, name: str | None) -> Website:
    site = db.query(Website).filter(Website.domain == domain).first()
    if site is None:
        site = Website(domain=domain, name=name)
        db.add(site)
        db.flush()
    return site


def _get_or_create_tracker(db: Session, t) -> Tracker:
    domain = normalize_domain(t.domain)
    tracker = db.query(Tracker).filter(Tracker.domain == domain).first()
    if tracker is None:
        tracker = Tracker(
            name=t.name or domain, domain=domain, category=t.category,
            risk_level=t.risk_level, is_third_party=t.is_third_party,
        )
        db.add(tracker)
        db.flush()
    return tracker


def save_scan(db: Session, user_id: str, body: ScanSaveRequest) -> Scan:
    site = _get_or_create_website(db, normalize_domain(body.domain), body.website_name)

    unique = {normalize_domain(t.domain): t for t in body.trackers}   # dedupe
    score = body.privacy_score if body.privacy_score is not None else estimate_privacy_score(body)

    scan = Scan(
        website_id=site.id, user_id=user_id, privacy_score=score,
        tracker_count=len(unique), cookie_count=body.cookie_count,
        permission_count=body.permission_count, request_count=body.request_count,
        third_party_request_count=body.third_party_request_count, summary=body.summary,
    )
    db.add(scan)
    db.flush()

    for t in unique.values():
        tracker = _get_or_create_tracker(db, t)
        db.add(ScanTracker(scan_id=scan.id, tracker_id=tracker.id))

    db.commit()
    db.refresh(scan)
    return scan


# ---------- insights ----------

def insights(db: Session, user_id: str, days: int = 30) -> InsightsResponse:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    mine = (Scan.user_id == user_id, Scan.created_at >= since)

    total = db.query(func.count(Scan.id)).filter(*mine).scalar() or 0
    avg = db.query(func.avg(Scan.privacy_score)).filter(*mine).scalar()

    day = func.date(Scan.created_at).label("day")
    trend = (
        db.query(day, func.avg(Scan.privacy_score), func.count(Scan.id))
        .filter(*mine).group_by(day).order_by(day).all()
    )

    sites_col = func.count(func.distinct(Scan.website_id)).label("sites")
    appear_col = func.count(ScanTracker.id).label("appearances")
    top = (
        db.query(Tracker.domain, Tracker.category, sites_col, appear_col)
        .join(ScanTracker, ScanTracker.tracker_id == Tracker.id)
        .join(Scan, Scan.id == ScanTracker.scan_id)
        .filter(*mine)
        .group_by(Tracker.id, Tracker.domain, Tracker.category)
        .order_by(desc("sites"), desc("appearances")).limit(10).all()
    )

    cats = (
        db.query(Tracker.category, func.count(ScanTracker.id))
        .join(ScanTracker, ScanTracker.tracker_id == Tracker.id)
        .join(Scan, Scan.id == ScanTracker.scan_id)
        .filter(*mine).group_by(Tracker.category).all()
    )

    avg_site = func.avg(Scan.privacy_score).label("avg_score")
    worst = (
        db.query(Website.domain, avg_site, func.count(Scan.id))
        .join(Scan, Scan.website_id == Website.id)
        .filter(*mine, Scan.privacy_score.isnot(None))
        .group_by(Website.id, Website.domain)
        .order_by(asc("avg_score")).limit(5).all()
    )

    r = lambda v: round(float(v), 1) if v is not None else None
    return InsightsResponse(
        days=days, total_scans=total, average_score=r(avg),
        score_trend=[{"day": str(d), "average_score": r(a), "scans": n} for d, a, n in trend],
        top_trackers=[{"domain": d, "category": c, "sites": s, "appearances": a}
                      for d, c, s, a in top],
        category_counts={(c or "unknown"): n for c, n in cats},
        lowest_scoring_sites=[{"domain": d, "average_score": r(a), "scans": n}
                              for d, a, n in worst],
    )