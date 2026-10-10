# routes/classify.py
from fastapi import APIRouter
from app.schemas.ai import ClassifyRequest, TrackerClassification
from app.services import classifier

router = APIRouter(prefix="/classify", tags=["classify"])

@router.post("", response_model=list[TrackerClassification])
def classify_domains(body: ClassifyRequest):
    return classifier.classify_many(body.domains)