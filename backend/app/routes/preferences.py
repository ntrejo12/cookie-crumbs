from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.preferences import UserPreferenceResponse, UserPreferenceUpdate
from app.services import preferences_service as svc

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("/me", response_model=UserPreferenceResponse)
def read_preferences(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return svc.get_or_create(db, user_id)


@router.patch("/me", response_model=UserPreferenceResponse)
def update_preferences(
    body: UserPreferenceUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return svc.update(db, user_id, body)