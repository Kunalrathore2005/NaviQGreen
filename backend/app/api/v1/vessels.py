from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import VesselCreate, VesselUpdate, VesselResponse
from app.services.fleet_service import FleetService

router = APIRouter(prefix="/vessels", tags=["Vessels & Fleet"])

@router.get("", response_model=List[VesselResponse])
def list_vessels(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    vessel_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    vessels, _ = FleetService.get_vessels(db, skip, limit, vessel_type, status, search)
    return vessels

@router.get("/{vessel_id}", response_model=VesselResponse)
def get_vessel(vessel_id: str, db: Session = Depends(get_db)):
    vessel = FleetService.get_vessel_by_id(db, vessel_id)
    if not vessel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel with ID '{vessel_id}' was not found."
        )
    return vessel

@router.post("", response_model=VesselResponse, status_code=status.HTTP_201_CREATED)
def create_vessel(data: VesselCreate, db: Session = Depends(get_db)):
    try:
        return FleetService.create_vessel(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{vessel_id}", response_model=VesselResponse)
def update_vessel(vessel_id: str, data: VesselUpdate, db: Session = Depends(get_db)):
    vessel = FleetService.update_vessel(db, vessel_id, data)
    if not vessel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel with ID '{vessel_id}' was not found."
        )
    return vessel

@router.delete("/{vessel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vessel(vessel_id: str, db: Session = Depends(get_db)):
    success = FleetService.delete_vessel(db, vessel_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel with ID '{vessel_id}' was not found."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/import-csv")
async def import_vessels_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8", errors="ignore")
    res = FleetService.import_vessels_csv(db, content_str)
    return res

@router.get("/export-csv/download")
def export_vessels_csv(db: Session = Depends(get_db)):
    csv_str = FleetService.export_vessels_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=naviqgreen_vessels.csv"}
    )

