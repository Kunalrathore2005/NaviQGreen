"""
NaviQGreen Quantum-Inspired Q-Bit & Han/Kim Rotation Laboratory API
Provides interactive endpoints for inspecting Q-bit probability amplitudes, 
Han & Kim unitary rotation gates, collapse measurements, and population entropy.
"""

import math
import random
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/quantum-lab", tags=["Quantum-Inspired Lab & Q-Bit Visualizer"])


class RotateRequest(BaseModel):
    alpha: float = Field(default=0.707106, description="Alpha amplitude (cos theta)")
    beta: float = Field(default=0.707106, description="Beta amplitude (sin theta)")
    x_bit: int = Field(default=0, ge=0, le=1, description="Measured bit for candidate individual")
    best_bit: int = Field(default=1, ge=0, le=1, description="Bit in elite best individual")
    is_worse: bool = Field(default=True, description="Whether candidate fitness is worse than best")
    step_size_deg: float = Field(default=4.5, ge=0.5, le=45.0, description="Step size Delta Theta in degrees")


class MeasureRequest(BaseModel):
    alpha: float = Field(default=0.707106)
    beta: float = Field(default=0.707106)
    trials: int = Field(default=500, ge=10, le=5000)


class CatastropheRequest(BaseModel):
    num_bits: int = Field(default=16, ge=4, le=64)
    stagnation_bias: float = Field(default=0.98, ge=0.5, le=1.0)


@router.get("/spec")
def get_quantum_spec():
    """
    Returns mathematical specifications, formulas, and Han & Kim (2002) lookup table rules.
    """
    return {
        "mathematical_model": "Quantum-Inspired Evolutionary Algorithm (QEA)",
        "citation": "Han, K. H., & Kim, J. H. (2002). IEEE Trans. Evol. Comput., 6(6), 580-593.",
        "state_equation": "|psi> = alpha |0> + beta |1>, where |alpha|^2 + |beta|^2 = 1",
        "hilbert_plane": "2D Classical Quantum Representation (Bloch Angle theta in [0, pi/2])",
        "rotation_operator": "[alpha', beta']^T = [[cos(d_theta), -sin(d_theta)], [sin(d_theta), cos(d_theta)]] [alpha, beta]^T",
        "han_kim_lookup_table": [
            {"x": 0, "b": 0, "f_worse": False, "sign": "0", "action": "Equal bits: No rotation"},
            {"x": 0, "b": 0, "f_worse": True, "sign": "0", "action": "Equal bits: No rotation"},
            {"x": 0, "b": 1, "f_worse": False, "sign": "0", "action": "Better fitness: No rotation"},
            {"x": 0, "b": 1, "f_worse": True, "condition": "alpha * beta > 0", "sign": "+1 (Counter-Clockwise)", "action": "Increase P(1) amplitude"},
            {"x": 0, "b": 1, "f_worse": True, "condition": "alpha * beta < 0", "sign": "-1 (Clockwise)", "action": "Increase P(1) amplitude"},
            {"x": 1, "b": 0, "f_worse": False, "sign": "0", "action": "Better fitness: No rotation"},
            {"x": 1, "b": 0, "f_worse": True, "condition": "alpha * beta > 0", "sign": "-1 (Clockwise)", "action": "Increase P(0) amplitude"},
            {"x": 1, "b": 0, "f_worse": True, "condition": "alpha * beta < 0", "sign": "+1 (Counter-Clockwise)", "action": "Increase P(0) amplitude"},
            {"x": 1, "b": 1, "f_worse": False, "sign": "0", "action": "Equal bits: No rotation"},
            {"x": 1, "b": 1, "f_worse": True, "sign": "0", "action": "Equal bits: No rotation"}
        ],
        "catastrophe_condition": "Hamming Entropy H(Q) < 0.05 resets stuck bits to pi/4 superposition."
    }


@router.post("/rotate")
def simulate_rotation_gate(req: RotateRequest):
    """
    Applies a single Han & Kim 2D unitary rotation operator and returns exact vector shifts.
    """
    # Normalize input
    norm_in = math.sqrt(req.alpha ** 2 + req.beta ** 2)
    if norm_in > 0:
        a = req.alpha / norm_in
        b = req.beta / norm_in
    else:
        a = 1.0 / math.sqrt(2.0)
        b = 1.0 / math.sqrt(2.0)

    delta_theta_rad = math.radians(req.step_size_deg)
    sign = 0.0
    rule_desc = "No rotation required (bits match or candidate is superior)"

    if req.is_worse:
        if req.x_bit == 0 and req.best_bit == 1:
            if a * b > 0:
                sign = 1.0
                rule_desc = "x=0, b=1, alpha*beta > 0 -> Counter-Clockwise (+Delta Theta) to increase |beta|^2"
            elif a * b < 0:
                sign = -1.0
                rule_desc = "x=0, b=1, alpha*beta < 0 -> Clockwise (-Delta Theta) to increase |beta|^2"
            elif a == 0:
                sign = 0.0
            elif b == 0:
                sign = 1.0
        elif req.x_bit == 1 and req.best_bit == 0:
            if a * b > 0:
                sign = -1.0
                rule_desc = "x=1, b=0, alpha*beta > 0 -> Clockwise (-Delta Theta) to increase |alpha|^2"
            elif a * b < 0:
                sign = 1.0
                rule_desc = "x=1, b=0, alpha*beta < 0 -> Counter-Clockwise (+Delta Theta) to increase |alpha|^2"
            elif a == 0:
                sign = -1.0
            elif b == 0:
                sign = 0.0

    applied_d_theta = sign * delta_theta_rad

    cos_t = math.cos(applied_d_theta)
    sin_t = math.sin(applied_d_theta)

    new_a = cos_t * a - sin_t * b
    new_b = sin_t * a + cos_t * b

    norm_out = math.sqrt(new_a ** 2 + new_b ** 2)
    if norm_out > 0:
        new_a /= norm_out
        new_b /= norm_out

    angle_before_deg = math.degrees(math.atan2(b, a)) % 360
    angle_after_deg = math.degrees(math.atan2(new_b, new_a)) % 360

    return {
        "status": "success",
        "rule_applied": rule_desc,
        "delta_theta_applied_deg": round(math.degrees(applied_d_theta), 2),
        "rotation_matrix": [
            [round(cos_t, 4), round(-sin_t, 4)],
            [round(sin_t, 4), round(cos_t, 4)]
        ],
        "state_before": {
            "alpha": round(a, 5),
            "beta": round(b, 5),
            "p_zero": round(a ** 2, 5),
            "p_one": round(b ** 2, 5),
            "theta_deg": round(angle_before_deg, 2)
        },
        "state_after": {
            "alpha": round(new_a, 5),
            "beta": round(new_b, 5),
            "p_zero": round(new_a ** 2, 5),
            "p_one": round(new_b ** 2, 5),
            "theta_deg": round(angle_after_deg, 2)
        }
    }


@router.post("/measure")
def simulate_measurement(req: MeasureRequest):
    """
    Simulates repeated quantum measurement (probabilistic wave collapse) of a Q-bit.
    """
    norm = math.sqrt(req.alpha ** 2 + req.beta ** 2)
    a = (req.alpha / norm) if norm > 0 else 0.7071
    b = (req.beta / norm) if norm > 0 else 0.7071

    prob_zero = a ** 2
    prob_one = b ** 2

    measured_zeros = 0
    measured_ones = 0
    rng = random.Random(42)

    sample_sequence = []
    for i in range(req.trials):
        val = 0 if rng.random() < prob_zero else 1
        if val == 0:
            measured_zeros += 1
        else:
            measured_ones += 1
        if i < 20:
            sample_sequence.append(val)

    return {
        "trials": req.trials,
        "theoretical_p_zero": round(prob_zero, 4),
        "theoretical_p_one": round(prob_one, 4),
        "measured_zeros": measured_zeros,
        "measured_ones": measured_ones,
        "empirical_frequency_zero": round(measured_zeros / req.trials, 4),
        "empirical_frequency_one": round(measured_ones / req.trials, 4),
        "sample_head_sequence": sample_sequence,
        "convergence_delta": round(abs((measured_ones / req.trials) - prob_one), 4)
    }


@router.post("/catastrophe")
def simulate_catastrophe(req: CatastropheRequest):
    """
    Simulates population Q-bit entropy collapse and demonstrates the catastrophe reset operator.
    """
    rng = random.Random(42)
    bits_before = []
    total_entropy_before = 0.0

    for i in range(req.num_bits):
        # Generate trapped/stagnated Q-bits near state 0 or state 1
        if rng.random() < 0.5:
            # Trapped near 0
            b = rng.uniform(0.01, 0.05)
            a = math.sqrt(1.0 - b ** 2)
        else:
            # Trapped near 1
            a = rng.uniform(0.01, 0.05)
            b = math.sqrt(1.0 - a ** 2)

        p0 = a ** 2
        p1 = b ** 2
        # Shannon entropy
        h = -(p0 * math.log2(max(p0, 1e-9)) + p1 * math.log2(max(p1, 1e-9)))
        total_entropy_before += h

        bits_before.append({
            "bit_index": i,
            "alpha": round(a, 4),
            "beta": round(b, 4),
            "p_zero": round(p0, 4),
            "p_one": round(p1, 4),
            "entropy": round(h, 4)
        })

    avg_entropy_before = total_entropy_before / req.num_bits
    catastrophe_triggered = avg_entropy_before < 0.15

    # Apply Catastrophe Operator: Reset trapped bits to equal superposition
    bits_after = []
    total_entropy_after = 0.0
    super_a = 1.0 / math.sqrt(2.0)
    super_b = 1.0 / math.sqrt(2.0)
    super_h = 1.0  # max entropy for 50/50

    for i, b_data in enumerate(bits_before):
        if catastrophe_triggered:
            bits_after.append({
                "bit_index": i,
                "alpha": round(super_a, 4),
                "beta": round(super_b, 4),
                "p_zero": 0.5,
                "p_one": 0.5,
                "entropy": 1.0,
                "reset_applied": True
            })
            total_entropy_after += super_h
        else:
            bits_after.append({**b_data, "reset_applied": False})
            total_entropy_after += b_data["entropy"]

    avg_entropy_after = total_entropy_after / req.num_bits

    return {
        "num_bits": req.num_bits,
        "entropy_before": round(avg_entropy_before, 4),
        "catastrophe_threshold": 0.15,
        "catastrophe_triggered": catastrophe_triggered,
        "entropy_after": round(avg_entropy_after, 4),
        "entropy_gain_pct": round(((avg_entropy_after - avg_entropy_before) / max(avg_entropy_before, 1e-4)) * 100, 1),
        "bits_before": bits_before[:8],
        "bits_after": bits_after[:8]
    }

