import csv
import io
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import DatasetMetadata
from app.schemas import DatasetValidationReport

class DatasetService:
    @staticmethod
    def validate_csv(content: str, filename: str) -> DatasetValidationReport:
        """
        Performs thorough validation on uploaded CSV dataset:
        - Row counts, column types, missing values, duplicates, outliers.
        """
        df = pd.read_csv(io.StringIO(content))
        total_rows = len(df)
        issues = []
        
        missing_dict = {col: int(df[col].isna().sum()) for col in df.columns}
        duplicates_count = int(df.duplicated().sum())
        if duplicates_count > 0:
            issues.append(f"Detected {duplicates_count} exact duplicate rows.")
            
        outliers_dict = {}
        for col in df.select_dtypes(include=["number"]).columns:
            q1 = df[col].quantile(0.01)
            q3 = df[col].quantile(0.99)
            iqr = q3 - q1
            outlier_mask = (df[col] < (q1 - 2.5 * iqr)) | (df[col] > (q3 + 2.5 * iqr))
            num_outliers = int(outlier_mask.sum())
            if num_outliers > 0:
                outliers_dict[col] = num_outliers
                
        # Determine status
        total_missing = sum(missing_dict.values())
        if total_missing > 0.20 * total_rows:
            validation_status = "FAILED"
            issues.append("Dataset exceeds 20% total missing value threshold.")
        elif total_missing > 0 or duplicates_count > 0 or len(outliers_dict) > 0:
            validation_status = "WARNING"
        else:
            validation_status = "PASSED"
            
        # Preview first 10 rows
        preview_rows = df.head(10).fillna("").to_dict(orient="records")
        valid_rows = total_rows - int(df.isna().any(axis=1).sum())
        invalid_rows = total_rows - valid_rows
        
        return DatasetValidationReport(
            total_rows=total_rows,
            valid_rows=valid_rows,
            invalid_rows=invalid_rows,
            missing_values=missing_dict,
            suspicious_outliers=outliers_dict,
            duplicates_count=duplicates_count,
            validation_status=validation_status,
            issues=issues,
            preview_rows=preview_rows
        )

    @staticmethod
    def save_uploaded_dataset(
        db: Session,
        content: str,
        filename: str,
        category: str = "USER_UPLOADED",
        data_source: str = "User Uploaded Maritime Log",
        version: str = "v1.0"
    ) -> DatasetMetadata:
        report = DatasetService.validate_csv(content, filename)
        
        # Save to file
        safe_name = "".join(c for c in filename if c.isalnum() or c in (".", "_", "-"))
        save_path = Path(settings.DATASETS_DIR) / safe_name
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        # Parse schema
        df = pd.read_csv(io.StringIO(content))
        schema_def = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        metadata = DatasetMetadata(
            dataset_name=safe_name,
            category=category,
            file_path=str(save_path),
            row_count=report.total_rows,
            column_count=len(df.columns),
            schema_definition=schema_def,
            validation_summary=report.model_dump(),
            data_source=data_source,
            version=version
        )
        db.add(metadata)
        db.commit()
        db.refresh(metadata)
        return metadata

    @staticmethod
    def get_datasets(db: Session) -> List[DatasetMetadata]:
        return db.query(DatasetMetadata).order_by(DatasetMetadata.created_at.desc()).all()

    @staticmethod
    def get_dataset_preview(db: Session, dataset_id: int) -> Optional[Dict[str, Any]]:
        record = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
        if not record or not Path(record.file_path).exists():
            return None
            
        df = pd.read_csv(record.file_path, nrows=50)
        return {
            "dataset_name": record.dataset_name,
            "category": record.category,
            "data_source": record.data_source,
            "version": record.version,
            "total_rows": record.row_count,
            "columns": list(df.columns),
            "rows": df.fillna("").to_dict(orient="records"),
            "validation_summary": record.validation_summary
        }

