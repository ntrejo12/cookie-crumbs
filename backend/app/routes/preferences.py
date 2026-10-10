from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db                
from app.schemas.preference import UserPreferenceUpdate, UserPreferenceResponse
from app.services import preferences_service as svc

router = APIRouter(prefix="/preferences", tags=["preferences"])

@router.get("/me", response_model=UserPreferenceResponse)
def read(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return svc.get_or_create(db, user_id)

@router.patch("/me", response_model=UserPreferenceResponse)
def patch(body: UserPreferenceUpdate, user_id: str = Depends(get_current_user_id),
          db: Session = Depends(get_db)):
    return svc.update(db, user_id, body)