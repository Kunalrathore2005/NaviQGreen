from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import DatasetMetadataResponse, DatasetValidationReport
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["Dataset Management & Provenance"])

@router.get("", response_model=List[DatasetMetadataResponse])
def list_datasets(db: Session = Depends(get_db)):
    return DatasetService.get_datasets(db)

@router.post("/validate-file", response_model=DatasetValidationReport)
async def validate_dataset_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported for dataset ingestion."
        )
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8", errors="ignore")
    return DatasetService.validate_csv(content_str, file.filename)

@router.post("/upload", response_model=DatasetMetadataResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    category: str = Form("USER_UPLOADED"),
    data_source: str = Form("User Uploaded Maritime Ingestion"),
    version: str = Form("v1.0"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8", errors="ignore")
    return DatasetService.save_uploaded_dataset(
        db=db,
        content=content_str,
        filename=file.filename,
        category=category,
        data_source=data_source,
        version=version
    )

@router.get("/{dataset_id}/preview")
def get_dataset_preview(dataset_id: int, db: Session = Depends(get_db)):
    preview = DatasetService.get_dataset_preview(db, dataset_id)
    if not preview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or file missing."
        )
    return preview

