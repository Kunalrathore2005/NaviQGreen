import csv
import io
import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import OptimizationJob, BenchmarkRun, Vessel

class ReportService:
    @staticmethod
    def generate_optimization_report_csv(job: OptimizationJob) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["# NaviQGreen - Fleet Optimization Deployment Plan Report"])
        writer.writerow(["# Generated At", datetime.utcnow().isoformat() + "Z"])
        writer.writerow(["# Job ID", job.id])
        writer.writerow(["# Job Name", job.job_name])
        writer.writerow(["# Algorithm", job.algorithm])
        writer.writerow(["# Status", job.status])
        writer.writerow(["# Feasibility", "FEASIBLE" if job.is_feasible else "INFEASIBLE"])
        writer.writerow(["# Best Objective Value", job.best_objective_value])
        writer.writerow(["# Runtime (ms)", job.runtime_ms])
        writer.writerow([])
        
        # Assignment details header
        writer.writerow([
            "vessel_id", "vessel_name", "vessel_type", "route_code", "origin_port",
            "destination_port", "distance_nm", "allocated_cargo_tonnes",
            "capacity_utilization_pct", "chosen_speed_knots", "chosen_fuel",
            "voyage_duration_hours", "arrival_margin_hours", "fuel_consumption_tonnes",
            "fuel_cost_usd", "operating_cost_usd", "total_cost_usd",
            "direct_emissions_tco2", "lifecycle_emissions_tco2eq", "shore_power_applied"
        ])
        
        solution = job.best_solution or {}
        assignments = solution.get("assignments", [])
        
        for a in assignments:
            writer.writerow([
                a.get("vessel_id"),
                a.get("vessel_name"),
                a.get("vessel_type"),
                a.get("route_code"),
                a.get("origin_port"),
                a.get("destination_port"),
                a.get("distance_nm"),
                a.get("allocated_cargo_tonnes"),
                a.get("capacity_utilization_pct"),
                a.get("chosen_speed_knots"),
                a.get("chosen_fuel"),
                a.get("voyage_duration_hours"),
                a.get("arrival_margin_hours"),
                a.get("fuel_consumption_tonnes"),
                a.get("fuel_cost_usd"),
                a.get("operating_cost_usd"),
                a.get("total_cost_usd"),
                a.get("direct_emissions_tco2"),
                a.get("lifecycle_emissions_tco2eq"),
                a.get("shore_power_applied")
            ])
            
        return output.getvalue()

    @staticmethod
    def generate_optimization_report_json(job: OptimizationJob) -> Dict[str, Any]:
        return {
            "platform": "NaviQGreen Quantum-Inspired Fleet Intelligence Platform",
            "report_generated_utc": datetime.utcnow().isoformat() + "Z",
            "job_id": job.id,
            "job_name": job.job_name,
            "algorithm": job.algorithm,
            "status": job.status,
            "is_feasible": job.is_feasible,
            "best_objective_value": job.best_objective_value,
            "runtime_ms": job.runtime_ms,
            "weights": job.weights,
            "constraints": job.constraints,
            "best_solution": job.best_solution,
            "convergence_history": job.convergence_history,
            "data_provenance": "NaviQGreen Physics-Informed Maritime Database & IMO 4th GHG Study Standards"
        }

