"""
NaviQGreen Conventional Optimization Baselines
Provides Genetic Algorithm (GA), Simulated Annealing (SA), and Exact Greedy Baselines
evaluated under identical problem formulations, constraints, and computational budgets.
"""

import math
import random
import time
from typing import List, Dict, Any, Tuple, Optional
from app.optimization.problem import (
    FleetProblemInstance,
    SolutionEvaluation,
    evaluate_fleet_solution
)
from app.optimization.qea import QEASolver


class GASolver:
    """
    Standard Genetic Algorithm baseline using identical chromosome decoding and fitness.
    """
    def __init__(
        self,
        instance: FleetProblemInstance,
        population_size: int = 30,
        generations: int = 50,
        crossover_rate: float = 0.85,
        mutation_rate: Optional[float] = None,
        random_seed: int = 42
    ):
        self.instance = instance
        self.pop_size = population_size
        self.generations = generations
        self.cx_rate = crossover_rate
        self.rng = random.Random(random_seed)
        
        # Borrow layout helper from QEASolver for strict equivalence
        self.helper = QEASolver(instance, population_size, generations, random_seed=random_seed)
        self.total_bits = self.helper.total_bits
        self.mut_rate = mutation_rate if mutation_rate is not None else (1.5 / self.total_bits)

    def solve(self) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Random binary population
        population: List[List[int]] = [
            [self.rng.randint(0, 1) for _ in range(self.total_bits)]
            for _ in range(self.pop_size)
        ]
        
        best_binary: Optional[List[int]] = None
        best_eval: Optional[SolutionEvaluation] = None
        best_obj = float("inf")
        
        convergence_history = []
        
        for gen in range(self.generations):
            evals = []
            for chrom in population:
                m, s, f, sh = self.helper.decode_solution(chrom)
                ev = evaluate_fleet_solution(self.instance, m, s, f, sh)
                evals.append(ev)
                
                is_better = False
                if best_eval is None:
                    is_better = True
                elif ev.is_feasible and not best_eval.is_feasible:
                    is_better = True
                elif ev.is_feasible == best_eval.is_feasible and ev.objective_value < best_obj:
                    is_better = True
                    
                if is_better:
                    best_obj = ev.objective_value
                    best_eval = ev
                    best_binary = list(chrom)
                    
            avg_obj = sum(e.objective_value for e in evals) / len(evals)
            feasible_count = sum(1 for e in evals if e.is_feasible)
            
            convergence_history.append({
                "generation": gen + 1,
                "best_objective": round(best_obj, 4),
                "avg_objective": round(avg_obj, 4),
                "feasible_solutions": feasible_count,
                "best_cost_usd": best_eval.total_cost_usd if best_eval else 0.0,
                "best_fuel_tonnes": best_eval.total_fuel_tonnes if best_eval else 0.0,
                "best_emissions_tco2": best_eval.total_lifecycle_emissions_tco2eq if best_eval else 0.0
            })
            
            # Tournament selection & creation of next generation
            new_pop: List[List[int]] = []
            
            # Elitism: retain top 2
            elite_indices = sorted(range(len(evals)), key=lambda i: evals[i].objective_value)[:2]
            for idx in elite_indices:
                new_pop.append(list(population[idx]))
                
            while len(new_pop) < self.pop_size:
                # Tournament selection (size 3)
                p1_candidates = self.rng.sample(range(self.pop_size), 3)
                p1_idx = min(p1_candidates, key=lambda i: evals[i].objective_value)
                p2_candidates = self.rng.sample(range(self.pop_size), 3)
                p2_idx = min(p2_candidates, key=lambda i: evals[i].objective_value)
                
                c1 = list(population[p1_idx])
                c2 = list(population[p2_idx])
                
                # Two-point Crossover
                if self.rng.random() < self.cx_rate:
                    pt1 = self.rng.randint(0, self.total_bits - 2)
                    pt2 = self.rng.randint(pt1 + 1, self.total_bits - 1)
                    c1[pt1:pt2], c2[pt1:pt2] = c2[pt1:pt2], c1[pt1:pt2]
                    
                # Bit-flip Mutation
                for k in range(self.total_bits):
                    if self.rng.random() < self.mut_rate:
                        c1[k] = 1 - c1[k]
                    if self.rng.random() < self.mut_rate:
                        c2[k] = 1 - c2[k]
                        
                new_pop.append(c1)
                if len(new_pop) < self.pop_size:
                    new_pop.append(c2)
                    
            population = new_pop
            
        runtime_ms = (time.time() - start_time) * 1000.0
        
        return {
            "algorithm": "GA",
            "is_feasible": best_eval.is_feasible if best_eval else False,
            "best_objective": best_obj,
            "best_evaluation": best_eval,
            "best_binary": best_binary,
            "convergence_history": convergence_history,
            "runtime_ms": round(runtime_ms, 2),
            "generations_run": self.generations,
            "population_size": self.pop_size,
        }


class SASolver:
    """
    Simulated Annealing baseline using Metropolis acceptance and geometric cooling.
    Computational budget: pop_size * generations total evaluations to match QEA & GA.
    """
    def __init__(
        self,
        instance: FleetProblemInstance,
        population_size: int = 30,
        generations: int = 50,
        initial_temp: float = 100.0,
        cooling_rate: float = 0.985,
        random_seed: int = 42
    ):
        self.instance = instance
        self.total_evaluations = population_size * generations
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.rng = random.Random(random_seed)
        
        self.helper = QEASolver(instance, population_size, generations, random_seed=random_seed)
        self.total_bits = self.helper.total_bits
        self.generations = generations

    def solve(self) -> Dict[str, Any]:
        start_time = time.time()
        
        current_chrom = [self.rng.randint(0, 1) for _ in range(self.total_bits)]
        m, s, f, sh = self.helper.decode_solution(current_chrom)
        current_eval = evaluate_fleet_solution(self.instance, m, s, f, sh)
        current_obj = current_eval.objective_value
        
        best_chrom = list(current_chrom)
        best_eval = current_eval
        best_obj = current_obj
        
        temp = self.initial_temp
        convergence_history = []
        evals_per_gen = self.total_evaluations // self.generations
        
        step = 0
        for gen in range(self.generations):
            gen_objs = []
            feasible_count = 0
            
            for _ in range(evals_per_gen):
                step += 1
                
                # Neighborhood perturbation: flip 1 to 3 bits
                neighbor = list(current_chrom)
                num_flips = self.rng.randint(1, 3)
                for _ in range(num_flips):
                    idx = self.rng.randint(0, self.total_bits - 1)
                    neighbor[idx] = 1 - neighbor[idx]
                    
                m, s, f, sh = self.helper.decode_solution(neighbor)
                neighbor_eval = evaluate_fleet_solution(self.instance, m, s, f, sh)
                neighbor_obj = neighbor_eval.objective_value
                gen_objs.append(neighbor_obj)
                if neighbor_eval.is_feasible:
                    feasible_count += 1
                    
                delta_e = neighbor_obj - current_obj
                accept = False
                if delta_e <= 0:
                    accept = True
                else:
                    prob = math.exp(-delta_e / max(temp, 1e-6))
                    if self.rng.random() < prob:
                        accept = True
                        
                if accept:
                    current_chrom = neighbor
                    current_eval = neighbor_eval
                    current_obj = neighbor_obj
                    
                    if current_obj < best_obj or (neighbor_eval.is_feasible and not best_eval.is_feasible):
                        best_obj = current_obj
                        best_eval = neighbor_eval
                        best_chrom = list(neighbor)
                        
                temp = max(temp * self.cooling_rate, 0.01)
                
            convergence_history.append({
                "generation": gen + 1,
                "best_objective": round(best_obj, 4),
                "avg_objective": round(sum(gen_objs) / len(gen_objs), 4),
                "feasible_solutions": feasible_count,
                "best_cost_usd": best_eval.total_cost_usd,
                "best_fuel_tonnes": best_eval.total_fuel_tonnes,
                "best_emissions_tco2": best_eval.total_lifecycle_emissions_tco2eq
            })
            
        runtime_ms = (time.time() - start_time) * 1000.0
        
        return {
            "algorithm": "SA",
            "is_feasible": best_eval.is_feasible,
            "best_objective": best_obj,
            "best_evaluation": best_eval,
            "best_binary": best_chrom,
            "convergence_history": convergence_history,
            "runtime_ms": round(runtime_ms, 2),
            "generations_run": self.generations,
            "population_size": evals_per_gen,
        }


class ExactGreedySolver:
    """
    Deterministic baseline solver that greedily pairs best-fitting available vessels
    to satisfy cargo demand at design cruising speeds.
    """
    def __init__(self, instance: FleetProblemInstance):
        self.instance = instance

    def solve(self) -> Dict[str, Any]:
        start_time = time.time()
        
        matrix = [[0 for _ in range(len(self.instance.routes))] for _ in range(len(self.instance.vessels))]
        speeds = []
        fuels = []
        shores = []
        
        assigned_vessels = set()
        
        # Sort routes by required cargo descending
        sorted_routes = sorted(enumerate(self.instance.routes), key=lambda x: x[1].required_cargo_tonnes, reverse=True)
        
        for r_idx, route in sorted_routes:
            best_v_idx = None
            min_diff = float("inf")
            
            for v_idx, vessel in enumerate(self.instance.vessels):
                if v_idx in assigned_vessels:
                    continue
                # Pick vessel closest to demand without massive waste
                diff = abs(vessel.cargo_capacity_tonnes - route.required_cargo_tonnes)
                if diff < min_diff:
                    min_diff = diff
                    best_v_idx = v_idx
                    
            if best_v_idx is not None:
                matrix[best_v_idx][r_idx] = 1
                assigned_vessels.add(best_v_idx)
                
        # Set speeds to design speed and fuel to default VLSFO or first compatible
        for v_idx, vessel in enumerate(self.instance.vessels):
            design_speed = (vessel.min_speed_knots + vessel.max_speed_knots) / 2.0
            speeds.append(design_speed)
            fuels.append(vessel.compatible_fuels[0])
            shores.append(True)
            
        evaluation = evaluate_fleet_solution(self.instance, matrix, speeds, fuels, shores)
        runtime_ms = (time.time() - start_time) * 1000.0
        
        return {
            "algorithm": "EXACT_GREEDY",
            "is_feasible": evaluation.is_feasible,
            "best_objective": evaluation.objective_value,
            "best_evaluation": evaluation,
            "best_binary": None,
            "convergence_history": [{
                "generation": 1,
                "best_objective": evaluation.objective_value,
                "avg_objective": evaluation.objective_value,
                "feasible_solutions": 1 if evaluation.is_feasible else 0,
                "best_cost_usd": evaluation.total_cost_usd,
                "best_fuel_tonnes": evaluation.total_fuel_tonnes,
                "best_emissions_tco2": evaluation.total_lifecycle_emissions_tco2eq
            }],
            "runtime_ms": round(runtime_ms, 2),
            "generations_run": 1,
            "population_size": 1,
        }

