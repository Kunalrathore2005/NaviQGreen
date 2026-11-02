from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import OptimizationJob
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports & Data Exports"])

@router.get("/optimization/{job_id}/csv")
def download_optimization_csv(job_id: int, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Optimization job not found.")
        
    csv_str = ReportService.generate_optimization_report_csv(job)
    filename = f"naviqgreen_optimization_job_{job_id}.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/optimization/{job_id}/json")
def download_optimization_json(job_id: int, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Optimization job not found.")
        
    return ReportService.generate_optimization_report_json(job)

