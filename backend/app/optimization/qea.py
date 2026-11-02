"""
NaviQGreen Quantum-Inspired Evolutionary Algorithm (QEA) Engine
Classical implementation of Q-bit probability representation, collapse measurement,
quantum rotation gates, diversity catastrophe, and elitist multi-objective fleet optimization.
Reference: Han, K. H., & Kim, J. H. (2002). Quantum-inspired evolutionary algorithm for a class
of combinatorial optimization problems. IEEE Transactions on Evolutionary Computation, 6(6), 580-593.
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

class QBit:
    """
    Representation of a single Q-bit: |psi> = alpha|0> + beta|1>
    with normalization condition: |alpha|^2 + |beta|^2 = 1.
    """
    __slots__ = ("alpha", "beta")
    
    def __init__(self, alpha: float = 1.0 / math.sqrt(2.0), beta: float = 1.0 / math.sqrt(2.0)):
        self.alpha = alpha
        self.beta = beta
        
    def collapse(self, rng: random.Random) -> int:
        """
        Collapses quantum superposition to classical bit 0 or 1 based on |alpha|^2 probability.
        """
        prob_zero = self.alpha ** 2
        return 0 if rng.random() < prob_zero else 1
        
    def rotate(self, delta_theta: float):
        """
        Applies 2D Quantum Rotation Gate U(delta_theta):
        [alpha'] = [cos(d_theta)  -sin(d_theta)] [alpha]
        [beta' ]   [sin(d_theta)   cos(d_theta)] [beta ]
        """
        cos_t = math.cos(delta_theta)
        sin_t = math.sin(delta_theta)
        
        new_alpha = cos_t * self.alpha - sin_t * self.beta
        new_beta = sin_t * self.alpha + cos_t * self.beta
        
        # Enforce numerical stability normalization
        norm = math.sqrt(new_alpha ** 2 + new_beta ** 2)
        if norm > 0:
            self.alpha = new_alpha / norm
            self.beta = new_beta / norm
        else:
            self.alpha = 1.0 / math.sqrt(2.0)
            self.beta = 1.0 / math.sqrt(2.0)


class QChromosome:
    """
    Quantum individual containing an array of Q-bits encoding:
    1. Vessel-to-Route assignments (N_vessels * N_routes bits)
    2. Speed discretization indices (N_vessels * 3 bits -> 8 speed levels)
    3. Fuel selection indices (N_vessels * 3 bits -> 8 fuel options)
    4. Shore power binary choices (N_vessels bits)
    """
    def __init__(self, num_bits: int):
        self.qbits: List[QBit] = [QBit() for _ in range(num_bits)]
        
    def measure(self, rng: random.Random) -> List[int]:
        return [q.collapse(rng) for q in self.qbits]


class QEASolver:
    """
    Solves the Fleet Deployment Problem using the Quantum-Inspired Evolutionary Algorithm.
    """
    def __init__(
        self,
        instance: FleetProblemInstance,
        population_size: int = 30,
        generations: int = 50,
        rotation_step_theta: float = 0.025 * math.pi, # ~4.5 degrees
        catastrophe_threshold: float = 0.05,
        random_seed: int = 42
    ):
        self.instance = instance
        self.pop_size = population_size
        self.generations = generations
        self.delta_theta_0 = rotation_step_theta
        self.catastrophe_threshold = catastrophe_threshold
        self.rng = random.Random(random_seed)
        
        self.num_vessels = len(instance.vessels)
        self.num_routes = len(instance.routes)
        
        # Bits layout
        self.assign_bits = self.num_vessels * self.num_routes
        self.speed_bits = self.num_vessels * 3
        self.fuel_bits = self.num_vessels * 3
        self.shore_bits = self.num_vessels
        
        self.total_bits = self.assign_bits + self.speed_bits + self.fuel_bits + self.shore_bits

    def decode_solution(
        self,
        binary_string: List[int]
    ) -> Tuple[List[List[int]], List[float], List[str], List[bool]]:
        """
        Decodes classical bit-string into concrete operational fleet decisions.
        """
        # 1. Assignment matrix
        matrix = []
        idx = 0
        for v in range(self.num_vessels):
            row = binary_string[idx : idx + self.num_routes]
            matrix.append(row)
            idx += self.num_routes
            
        # 2. Speeds (discretized across vessel allowable range [min, max])
        speeds = []
        for v in range(self.num_vessels):
            vessel = self.instance.vessels[v]
            chunk = binary_string[idx : idx + 3]
            idx += 3
            val = chunk[0] * 4 + chunk[1] * 2 + chunk[2] # 0 to 7
            speed_ratio = val / 7.0
            speed = vessel.min_speed_knots + speed_ratio * (vessel.max_speed_knots - vessel.min_speed_knots)
            speeds.append(speed)
            
        # 3. Fuel choices
        fuels = []
        for v in range(self.num_vessels):
            vessel = self.instance.vessels[v]
            chunk = binary_string[idx : idx + 3]
            idx += 3
            val = chunk[0] * 4 + chunk[1] * 2 + chunk[2]
            chosen_fuel_idx = val % len(vessel.compatible_fuels)
            fuels.append(vessel.compatible_fuels[chosen_fuel_idx])
            
        # 4. Shore power choices
        shores = []
        for v in range(self.num_vessels):
            shores.append(bool(binary_string[idx]))
            idx += 1
            
        return matrix, speeds, fuels, shores

    def _determine_rotation_angle(
        self,
        x_bit: int,
        best_bit: int,
        alpha: float,
        beta: float,
        is_worse: bool
    ) -> float:
        """
        Han & Kim lookup table for quantum rotation gate angle Delta Theta.
        Rotates amplitude towards best solution bit if current candidate is worse.
        """
        if not is_worse:
            return 0.0
            
        sign = 0.0
        # If current bit is 0 and best is 1 -> we need to increase probability of 1 (|beta|^2)
        if x_bit == 0 and best_bit == 1:
            if alpha * beta > 0:
                sign = 1.0
            elif alpha * beta < 0:
                sign = -1.0
            elif alpha == 0:
                sign = 0.0
            elif beta == 0:
                sign = 1.0
        # If current bit is 1 and best is 0 -> we need to increase probability of 0 (|alpha|^2)
        elif x_bit == 1 and best_bit == 0:
            if alpha * beta > 0:
                sign = -1.0
            elif alpha * beta < 0:
                sign = 1.0
            elif alpha == 0:
                sign = -1.0
            elif beta == 0:
                sign = 0.0
        else:
            sign = 0.0
            
        return sign * self.delta_theta_0

    def solve(self) -> Dict[str, Any]:
        """
        Runs the full Quantum-Inspired Evolutionary Algorithm.
        """
        start_time = time.time()
        
        # 1. Initialize Q-population in equal superposition
        population = [QChromosome(self.total_bits) for _ in range(self.pop_size)]
        
        best_binary: Optional[List[int]] = None
        best_eval: Optional[SolutionEvaluation] = None
        best_obj = float("inf")
        
        convergence_history = []
        
        for gen in range(self.generations):
            gen_binaries = []
            gen_evals: List[SolutionEvaluation] = []
            
            # 2. Measurement / Collapse step
            for individual in population:
                binary = individual.measure(self.rng)
                gen_binaries.append(binary)
                
                # Decode and evaluate
                matrix, speeds, fuels, shores = self.decode_solution(binary)
                evaluation = evaluate_fleet_solution(self.instance, matrix, speeds, fuels, shores)
                gen_evals.append(evaluation)
                
                # Elitism tracking: prioritize feasible solutions with lower objective
                is_better = False
                if best_eval is None:
                    is_better = True
                elif evaluation.is_feasible and not best_eval.is_feasible:
                    is_better = True
                elif evaluation.is_feasible == best_eval.is_feasible and evaluation.objective_value < best_obj:
                    is_better = True
                    
                if is_better:
                    best_obj = evaluation.objective_value
                    best_eval = evaluation
                    best_binary = list(binary)

            # Record generation progress
            avg_obj = sum(e.objective_value for e in gen_evals) / len(gen_evals)
            feasible_count = sum(1 for e in gen_evals if e.is_feasible)
            
            convergence_history.append({
                "generation": gen + 1,
                "best_objective": round(best_obj, 4),
                "avg_objective": round(avg_obj, 4),
                "feasible_solutions": feasible_count,
                "best_cost_usd": best_eval.total_cost_usd if best_eval else 0.0,
                "best_fuel_tonnes": best_eval.total_fuel_tonnes if best_eval else 0.0,
                "best_emissions_tco2": best_eval.total_lifecycle_emissions_tco2eq if best_eval else 0.0
            })
            
            # 3. Quantum Rotation Gate Update
            for i, individual in enumerate(population):
                current_binary = gen_binaries[i]
                current_eval = gen_evals[i]
                is_worse = (current_eval.objective_value > best_obj) or (not current_eval.is_feasible and best_eval.is_feasible)
                
                for k, qbit in enumerate(individual.qbits):
                    delta_theta = self._determine_rotation_angle(
                        x_bit=current_binary[k],
                        best_bit=best_binary[k],
                        alpha=qbit.alpha,
                        beta=qbit.beta,
                        is_worse=is_worse
                    )
                    qbit.rotate(delta_theta)
                    
            # 4. Quantum Diversity Check & Catastrophe / Re-superposition Operator
            # Measure average superposition entropy: if bits are collapsed uniformly, inject quantum noise
            avg_prob_diff = sum(abs(q.alpha ** 2 - 0.5) for ind in population for q in ind.qbits) / (len(population) * self.total_bits)
            if avg_prob_diff > (0.5 - self.catastrophe_threshold):
                # Population has converged heavily, apply phase perturbation to non-elite individuals
                for ind in population[1:]:
                    for q in ind.qbits:
                        if self.rng.random() < 0.15:
                            # Perturb towards balanced superposition
                            q.alpha = (q.alpha + (1.0 / math.sqrt(2.0))) / 2.0
                            q.beta = math.sqrt(max(0.0, 1.0 - q.alpha ** 2))

        runtime_ms = (time.time() - start_time) * 1000.0
        
        return {
            "algorithm": "QEA",
            "is_feasible": best_eval.is_feasible if best_eval else False,
            "best_objective": best_obj,
            "best_evaluation": best_eval,
            "best_binary": best_binary,
            "convergence_history": convergence_history,
            "runtime_ms": round(runtime_ms, 2),
            "generations_run": self.generations,
            "population_size": self.pop_size,
        }

