import csv
import io
import json
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import Vessel
from app.schemas import VesselCreate, VesselUpdate

class FleetService:
    @staticmethod
    def get_vessels(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        vessel_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Vessel], int]:
        query = db.query(Vessel)
        if vessel_type:
            query = query.filter(Vessel.vessel_type == vessel_type)
        if status:
            query = query.filter(Vessel.availability_status == status)
        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                (Vessel.vessel_name.ilike(s)) | (Vessel.vessel_id.ilike(s))
            )
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_vessel_by_id(db: Session, vessel_id: str) -> Optional[Vessel]:
        return db.query(Vessel).filter(Vessel.vessel_id == vessel_id).first()

    @staticmethod
    def create_vessel(db: Session, data: VesselCreate) -> Vessel:
        existing = db.query(Vessel).filter(Vessel.vessel_id == data.vessel_id).first()
        if existing:
            raise ValueError(f"Vessel with ID {data.vessel_id} already exists.")
            
        vessel = Vessel(**data.model_dump())
        db.add(vessel)
        db.commit()
        db.refresh(vessel)
        return vessel

    @staticmethod
    def update_vessel(db: Session, vessel_id: str, data: VesselUpdate) -> Optional[Vessel]:
        vessel = db.query(Vessel).filter(Vessel.vessel_id == vessel_id).first()
        if not vessel:
            return None
            
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vessel, key, value)
            
        db.commit()
        db.refresh(vessel)
        return vessel

    @staticmethod
    def delete_vessel(db: Session, vessel_id: str) -> bool:
        vessel = db.query(Vessel).filter(Vessel.vessel_id == vessel_id).first()
        if not vessel:
            return False
        db.delete(vessel)
        db.commit()
        return True

    @staticmethod
    def import_vessels_csv(db: Session, csv_content: str) -> Dict[str, Any]:
        reader = csv.DictReader(io.StringIO(csv_content))
        created_count = 0
        errors = []
        
        for idx, row in enumerate(reader, start=2): # Line 1 is header
            try:
                v_id = row.get("vessel_id", "").strip()
                if not v_id:
                    errors.append(f"Row {idx}: Missing vessel_id")
                    continue
                
                # Check for existing
                if db.query(Vessel).filter(Vessel.vessel_id == v_id).first():
                    errors.append(f"Row {idx}: Vessel {v_id} already exists")
                    continue
                    
                raw_fuels = row.get("compatible_fuels", '["VLSFO"]')
                if isinstance(raw_fuels, str):
                    try:
                        compatible_fuels = json.loads(raw_fuels)
                    except json.JSONDecodeError:
                        compatible_fuels = [f.strip() for f in raw_fuels.split(",") if f.strip()]
                else:
                    compatible_fuels = ["VLSFO"]
                    
                vessel = Vessel(
                    vessel_id=v_id,
                    vessel_name=row.get("vessel_name", f"Vessel {v_id}"),
                    vessel_type=row.get("vessel_type", "Container"),
                    deadweight_tonnage=float(row.get("deadweight_tonnage", 50000.0)),
                    cargo_capacity_tonnes=float(row.get("cargo_capacity_tonnes", 45000.0)),
                    engine_power_kw=float(row.get("engine_power_kw", 25000.0)),
                    length_m=float(row.get("length_m")) if row.get("length_m") else None,
                    beam_m=float(row.get("beam_m")) if row.get("beam_m") else None,
                    draft_m=float(row.get("draft_m")) if row.get("draft_m") else None,
                    design_speed_knots=float(row.get("design_speed_knots", 18.0)),
                    minimum_speed_knots=float(row.get("minimum_speed_knots", 10.0)),
                    maximum_speed_knots=float(row.get("maximum_speed_knots", 22.0)),
                    compatible_fuels=compatible_fuels,
                    availability_status=row.get("availability_status", "AVAILABLE"),
                    maintenance_status=row.get("maintenance_status", "GOOD"),
                    daily_charter_cost_usd=float(row.get("daily_charter_cost_usd", 15000.0)),
                    crew_cost_per_day_usd=float(row.get("crew_cost_per_day_usd", 4500.0)),
                    data_source=row.get("data_source", "CSV Import"),
                    is_hypothetical=str(row.get("is_hypothetical", "false")).lower() in ("true", "1")
                )
                db.add(vessel)
                created_count += 1
            except Exception as e:
                errors.append(f"Row {idx}: Parse error: {str(e)}")
                
        db.commit()
        return {
            "success": len(errors) == 0,
            "created_count": created_count,
            "errors": errors
        }

    @staticmethod
    def export_vessels_csv(db: Session) -> str:
        vessels = db.query(Vessel).all()
        output = io.StringIO()
        fieldnames = [
            "vessel_id", "vessel_name", "vessel_type", "deadweight_tonnage",
            "cargo_capacity_tonnes", "engine_power_kw", "length_m", "beam_m",
            "draft_m", "design_speed_knots", "minimum_speed_knots", "maximum_speed_knots",
            "compatible_fuels", "availability_status", "maintenance_status",
            "daily_charter_cost_usd", "crew_cost_per_day_usd", "data_source",
            "is_hypothetical", "notes"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for v in vessels:
            writer.writerow({
                "vessel_id": v.vessel_id,
                "vessel_name": v.vessel_name,
                "vessel_type": v.vessel_type,
                "deadweight_tonnage": v.deadweight_tonnage,
                "cargo_capacity_tonnes": v.cargo_capacity_tonnes,
                "engine_power_kw": v.engine_power_kw,
                "length_m": v.length_m,
                "beam_m": v.beam_m,
                "draft_m": v.draft_m,
                "design_speed_knots": v.design_speed_knots,
                "minimum_speed_knots": v.minimum_speed_knots,
                "maximum_speed_knots": v.maximum_speed_knots,
                "compatible_fuels": json.dumps(v.compatible_fuels),
                "availability_status": v.availability_status,
                "maintenance_status": v.maintenance_status,
                "daily_charter_cost_usd": v.daily_charter_cost_usd,
                "crew_cost_per_day_usd": v.crew_cost_per_day_usd,
                "data_source": v.data_source,
                "is_hypothetical": v.is_hypothetical,
                "notes": v.notes or ""
            })
        return output.getvalue()

