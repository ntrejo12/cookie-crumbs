from sqlalchemy.orm import Session, joinedload

from app.db.models import Scan, Website


def list_scans(db: Session, user_id: str, limit: int = 20, offset: int = 0,
               domain: str | None = None) -> list[Scan]:
    q = (
        db.query(Scan)
        .options(joinedload(Scan.website))
        .filter(Scan.user_id == user_id)
    )
    if domain:
        q = q.join(Scan.website).filter(Website.domain == domain)
    return q.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()


def get_scan(db: Session, user_id: str, scan_id: int) -> Scan | None:
    # filtering by user_id means users can never read each other's scans
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
    db.delete(scan) # scan_trackers are removed via the model's cascade
    db.commit()
    return True


def delete_all(db: Session, user_id: str) -> int:
    scans = db.query(Scan).filter(Scan.user_id == user_id).all()
    for scan in scans: 
        db.delete(scan)
    db.commit()
    return len(scans)