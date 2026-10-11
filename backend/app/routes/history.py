from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.history import (
    InsightsResponse, ScanHistoryResponse, ScanSaveRequest, ScanSaveResult,
)
from app.services import history_service as svc
from app.services import preferences_service

router = APIRouter(prefix="/history", tags=["history"])


@router.post("", response_model=ScanSaveResult)
def save_history(body: ScanSaveRequest,
                 user_id: str = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    prefs = preferences_service.get_or_create(db, user_id)
    if not prefs.save_scan_history:
        # not an error: the user simply hasn't opted in, so nothing is stored
        return ScanSaveResult(saved=False,
                              reason="Scan history is turned off in your preferences.")
    scan = svc.save_scan(db, user_id, body)
    return ScanSaveResult(saved=True, scan=ScanHistoryResponse.model_validate(scan))


@router.get("", response_model=list[ScanHistoryResponse])
def list_history(limit: int = Query(20, ge=1, le=100),
                 offset: int = Query(0, ge=0),
                 domain: str | None = None,
                 user_id: str = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    return svc.list_scans(db, user_id, limit, offset, domain)


@router.get("/insights", response_model=InsightsResponse)      # must come before /{scan_id}
def history_insights(days: int = Query(30, ge=1, le=365),
                     user_id: str = Depends(get_current_user_id),
                     db: Session = Depends(get_db)):
    return svc.insights(db, user_id, days)


@router.get("/{scan_id}", response_model=ScanHistoryResponse)
def get_history_item(scan_id: int,
                     user_id: str = Depends(get_current_user_id),
                     db: Session = Depends(get_db)):
    scan = svc.get_scan(db, user_id, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return scan


@router.delete("/{scan_id}", status_code=204)
def delete_history_item(scan_id: int,
                        user_id: str = Depends(get_current_user_id),
                        db: Session = Depends(get_db)):
    if not svc.delete_scan(db, user_id, scan_id):
        raise HTTPException(status_code=404, detail="Scan not found.")
    return Response(status_code=204)


@router.delete("", status_code=204)
def clear_history(user_id: str = Depends(get_current_user_id),
                  db: Session = Depends(get_db)):
    svc.delete_all(db, user_id)
    return Response(status_code=204)