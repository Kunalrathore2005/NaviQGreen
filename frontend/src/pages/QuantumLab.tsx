import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Atom,
  RotateCw,
  Cpu,
  Zap,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  QuantumRotateResponse,
  QuantumMeasureResponse,
  QuantumCatastropheResponse,
} from '../types';

export const QuantumLab: React.FC = () => {
  // --- Section 1: Bloch / Hilbert Unit Circle State ---
  const [thetaDeg, setThetaDeg] = useState<number>(45.0);
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const alpha = Math.cos(thetaRad);
  const beta = Math.sin(thetaRad);
  const pZero = Math.pow(alpha, 2);
  const pOne = Math.pow(beta, 2);

  // --- Section 2: Han & Kim Unitary Gate Controls ---
  const [xBit, setXBit] = useState<number>(0);
  const [bestBit, setBestBit] = useState<number>(1);
  const [isWorse, setIsWorse] = useState<boolean>(true);
  const [stepSizeDeg, setStepSizeDeg] = useState<number>(4.5);
  const [rotationResult, setRotationResult] = useState<QuantumRotateResponse | null>(null);
  const [rotating, setRotating] = useState(false);

  // --- Section 3: Collapse Measurement ---
  const [trials, setTrials] = useState<number>(500);
  const [measurementResult, setMeasurementResult] = useState<QuantumMeasureResponse | null>(null);
  const [measuring, setMeasuring] = useState(false);

  // --- Section 4: Catastrophe Simulation ---
  const [catastropheResult, setCatastropheResult] = useState<QuantumCatastropheResponse | null>(null);
  const [simulatingCatastrophe, setSimulatingCatastrophe] = useState(false);

  // Run initial catastrophe demo
  useEffect(() => {
    const initCatastrophe = async () => {
      try {
        const res = await api.simulateQuantumCatastrophe({ num_bits: 16, stagnation_bias: 0.98 });
        setCatastropheResult(res);
      } catch (err) {
        console.error('Failed to init catastrophe simulation', err);
      }
    };
    initCatastrophe();
  }, []);

  // Handle Rotation API call
  const handleRotate = async () => {
    try {
      setRotating(true);
      const res = await api.rotateQuantumGate({
        alpha,
        beta,
        x_bit: xBit,
        best_bit: bestBit,
        is_worse: isWorse,
        step_size_deg: stepSizeDeg,
      });
      setRotationResult(res);
      // Update interactive angle to reflect rotated vector
      setThetaDeg(res.state_after.theta_deg);
    } catch (err) {
      console.error('Rotation failed', err);
    } finally {
      setRotating(false);
    }
  };

  // Handle Measurement API call
  const handleMeasure = async () => {
    try {
      setMeasuring(true);
      const res = await api.measureQuantumBit({ alpha, beta, trials });
      setMeasurementResult(res);
    } catch (err) {
      console.error('Measurement failed', err);
    } finally {
      setMeasuring(false);
    }
  };

  // Trigger Catastrophe Operator
  const handleCatastrophe = async (stagnate: boolean) => {
    try {
      setSimulatingCatastrophe(true);
      const res = await api.simulateQuantumCatastrophe({
        num_bits: 16,
        stagnation_bias: stagnate ? 0.98 : 0.60,
      });
      setCatastropheResult(res);
    } catch (err) {
      console.error('Catastrophe simulation failed', err);
    } finally {
      setSimulatingCatastrophe(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-brand/10 border border-cyan-brand/30 text-cyan-brand shadow-glow-cyan">
              <Atom className="w-5 h-5 animate-spin-slow" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Quantum-Inspired Q-Bit & Han/Kim Rotation Laboratory
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-leaf/20 text-emerald-glow border border-emerald-leaf/40">
              Han & Kim (2002) Mathematical Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate classical Q-bit superpositions, 2D unitary rotation operators, probabilistic wave collapse, and entropy catastrophe operators.
          </p>
        </div>
      </div>

      {/* Top 2-Column Section: Unit Circle Vector vs. Rotation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D Bloch / Hilbert Superposition Circle (5 cols) */}
        <div className="lg:col-span-5 card-maritime p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-brand" />
                <h2 className="text-sm font-bold text-white">Q-Bit State Vector |ψ⟩</h2>
              </div>
              <span className="text-[11px] font-mono text-cyan-brand font-semibold">
                θ = {thetaDeg.toFixed(1)}° ({(thetaRad / Math.PI).toFixed(2)}π)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              State: <code className="text-cyan-brand font-mono font-bold">|ψ⟩ = α|0⟩ + β|1⟩</code> on the Hilbert unit quarter-circle.
            </p>

            {/* Interactive SVG Unit Circle */}
            <div className="relative flex items-center justify-center p-3 bg-navy-950/80 rounded-xl border border-navy-800">
              <svg width="260" height="260" viewBox="-30 -30 260 260" className="select-none">
                {/* Background Grid */}
                <circle cx="100" cy="100" r="100" fill="none" stroke="#1E3A5F" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M 0 100 A 100 100 0 0 1 100 0" fill="none" stroke="#00B4D8" strokeWidth="2.5" opacity="0.6" />

                {/* Axes */}
                <line x1="0" y1="100" x2="210" y2="100" stroke="#475569" strokeWidth="1.5" />
                <line x1="100" y1="210" x2="100" y2="-10" stroke="#475569" strokeWidth="1.5" />

                {/* Axis Labels */}
                <text x="215" y="104" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">|0⟩ (α)</text>
                <text x="105" y="-12" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">|1⟩ (β)</text>
                <text x="90" y="115" fill="#64748B" fontSize="10" fontFamily="sans-serif">0</text>

                {/* Projections to Axes */}
                <line
                  x1={100 + 100 * alpha}
                  y1={100 - 100 * beta}
                  x2={100 + 100 * alpha}
                  y2="100"
                  stroke="#38BDF8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <line
                  x1={100 + 100 * alpha}
                  y1={100 - 100 * beta}
                  x2="100"
                  y2={100 - 100 * beta}
                  stroke="#34D399"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* State Vector Line */}
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 100 * alpha}
                  y2={100 - 100 * beta}
                  stroke="#00B4D8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Vector Head */}
                <circle
                  cx={100 + 100 * alpha}
                  cy={100 - 100 * beta}
                  r="6"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_6px_#10B981]"
                />
              </svg>
            </div>
          </div>

          {/* Probability & Angle Sliders */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Angle θ Adjust:</span>
                <span className="text-white font-bold">{thetaDeg.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="0.5"
                value={thetaDeg}
                onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
                className="w-full accent-cyan-brand bg-navy-950 h-2 rounded cursor-pointer"
              />
            </div>

            {/* Quick State Presets */}
            <div className="flex gap-2 text-[10px]">
              <button
                onClick={() => setThetaDeg(45.0)}
                className="flex-1 py-1 rounded bg-cyan-brand/10 hover:bg-cyan-brand/20 text-cyan-300 border border-cyan-brand/30"
              >
                Equal Superposition (45°)
              </button>
              <button
                onClick={() => setThetaDeg(0.0)}
                className="flex-1 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700"
              >
                Pure |0⟩ (0°)
              </button>
              <button
                onClick={() => setThetaDeg(90.0)}
                className="flex-1 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700"
              >
                Pure |1⟩ (90°)
              </button>
            </div>

            {/* Amplitudes & Probabilities Readout */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-navy-750">
              <div className="bg-navy-950/70 p-2.5 rounded-lg border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-mono">α = cos(θ)</span>
                <span className="text-base font-bold text-cyan-brand font-mono">{alpha.toFixed(4)}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  P(|0⟩) = |α|² = <b className="text-white font-bold">{(pZero * 100).toFixed(1)}%</b>
                </span>
              </div>

              <div className="bg-navy-950/70 p-2.5 rounded-lg border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-mono">β = sin(θ)</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{beta.toFixed(4)}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  P(|1⟩) = |β|² = <b className="text-white font-bold">{(pOne * 100).toFixed(1)}%</b>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Normalization:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                |α|² + |β|² = {(pZero + pOne).toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Han & Kim Unitary Rotation Operator Simulation (7 cols) */}
        <div className="lg:col-span-7 card-maritime p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-750">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">
                  Han & Kim (2002) 2D Unitary Rotation Gate U(Δθ)
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Lookup Table Matrix</span>
            </div>

            <p className="text-xs text-slate-400">
              In QEA, Q-bit probabilities evolve toward the elite best solution through classical rotation gates without premature collapse:
            </p>

            {/* Matrix Equation Banner */}
            <div className="bg-navy-950/80 p-3 rounded-lg border border-navy-800 font-mono text-xs flex items-center justify-around text-slate-200 overflow-x-auto">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">Next Amplitudes</span>
                <span className="text-cyan-brand font-bold">[ α(t+1) , β(t+1) ]ᵀ</span>
              </div>
              <span className="text-slate-500 font-bold">=</span>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">2D Unitary Gate U(Δθ)</span>
                <span className="text-emerald-400 font-bold">[[ cos(Δθ), -sin(Δθ) ], [ sin(Δθ), cos(Δθ) ]]</span>
              </div>
              <span className="text-slate-500 font-bold">×</span>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">Current Vector</span>
                <span className="text-white font-bold">[ α(t) , β(t) ]ᵀ</span>
              </div>
            </div>

            {/* Interactive Control Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-navy-950/70 p-3 rounded-lg border border-navy-800">
                <label className="text-slate-400 block mb-1.5 font-medium">Candidate Bit (x_i)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setXBit(0)}
                    className={`flex-1 py-1 rounded font-mono font-bold transition ${
                      xBit === 0 ? 'bg-cyan-brand text-white shadow-glow-cyan' : 'bg-navy-800 text-slate-400'
                    }`}
                  >
                    0
                  </button>
                  <button
                    onClick={() => setXBit(1)}
                    className={`flex-1 py-1 rounded font-mono font-bold transition ${
                      xBit === 1 ? 'bg-cyan-brand text-white shadow-glow-cyan' : 'bg-navy-800 text-slate-400'
                    }`}
                  >
                    1
                  </button>
                </div>
              </div>

              <div className="bg-navy-950/70 p-3 rounded-lg border border-navy-800">
                <label className="text-slate-400 block mb-1.5 font-medium">Elite Best Bit (b_i)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBestBit(0)}
                    className={`flex-1 py-1 rounded font-mono font-bold transition ${
                      bestBit === 0 ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-navy-800 text-slate-400'
                    }`}
                  >
                    0
                  </button>
                  <button
                    onClick={() => setBestBit(1)}
                    className={`flex-1 py-1 rounded font-mono font-bold transition ${
                      bestBit === 1 ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-navy-800 text-slate-400'
                    }`}
                  >
                    1
                  </button>
                </div>
              </div>

              <div className="bg-navy-950/70 p-3 rounded-lg border border-navy-800">
                <label className="text-slate-400 block mb-1.5 font-medium">Fitness Condition</label>
                <button
                  onClick={() => setIsWorse(!isWorse)}
                  className={`w-full py-1 px-2 rounded font-medium text-[11px] transition ${
                    isWorse
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isWorse ? 'Candidate Worse: f(x) > f(b)' : 'Candidate Better: f(x) ≤ f(b)'}
                </button>
              </div>
            </div>

            {/* Step Size Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Rotation Step Angle Δθ₀:</span>
                <span className="text-cyan-brand font-bold">{stepSizeDeg}° ({((stepSizeDeg * Math.PI) / 180).toFixed(3)} rad)</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.5"
                value={stepSizeDeg}
                onChange={(e) => setStepSizeDeg(parseFloat(e.target.value))}
                className="w-full accent-cyan-brand bg-navy-950 h-2 rounded cursor-pointer"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleRotate}
              disabled={rotating}
              className="btn-cyan w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-glow-cyan"
            >
              <RotateCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
              <span>Apply Han & Kim Unitary Gate U(Δθ)</span>
            </button>
          </div>

          {/* Rotation Gate Dynamic Result HUD */}
          {rotationResult && (
            <div className="mt-4 p-3.5 rounded-xl bg-navy-950/90 border border-emerald-500/30 text-xs animate-in fade-in duration-200 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Unitary Gate Successfully Applied
                </span>
                <span className="font-mono text-cyan-brand font-bold">
                  Δθ = {rotationResult.delta_theta_applied_deg > 0 ? `+${rotationResult.delta_theta_applied_deg}°` : `${rotationResult.delta_theta_applied_deg}°`}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 font-mono">
                Rule: {rotationResult.rule_applied}
              </p>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                <div className="bg-navy-900 p-2 rounded">
                  <span className="text-slate-400 block">P(|1⟩) Before:</span>
                  <span className="text-slate-300 font-bold">{(rotationResult.state_before.p_one * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-navy-900 p-2 rounded border border-emerald-500/30">
                  <span className="text-slate-400 block">P(|1⟩) After Rotation:</span>
                  <span className="text-emerald-400 font-bold">{(rotationResult.state_after.p_one * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Probabilistic Collapse Measurement (Monte Carlo Verification) */}
      <div className="card-maritime p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-navy-750 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-brand" />
              <h2 className="text-sm font-bold text-white">Quantum Wavefunction Collapse Simulator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulates classical measurement collapse |ψ⟩ → x ∈ {'{0, 1}'} to demonstrate empirical convergence to theoretical |α|² and |β|² probabilities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value))}
              className="input-maritime text-xs py-1.5 px-3 bg-navy-950 border border-navy-750 rounded text-slate-200"
            >
              <option value={100}>100 Measurement Trials</option>
              <option value={500}>500 Measurement Trials</option>
              <option value={1000}>1,000 Measurement Trials</option>
              <option value={2500}>2,500 Measurement Trials</option>
            </select>

            <button
              onClick={handleMeasure}
              disabled={measuring}
              className="btn-emerald py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-glow-emerald"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Collapse</span>
            </button>
          </div>
        </div>

        {measurementResult ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Probability Distribution Bars */}
            <div className="md:col-span-6 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Collapsed State 0 (Conventional / Low Speed):</span>
                  <span className="text-cyan-brand font-bold">
                    {measurementResult.measured_zeros} times ({(measurementResult.empirical_frequency_zero * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-navy-950 h-3 rounded-full overflow-hidden p-0.5 border border-navy-800">
                  <div
                    className="bg-cyan-brand h-full rounded-full transition-all duration-500 shadow-glow-cyan"
                    style={{ width: `${measurementResult.empirical_frequency_zero * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Theoretical |α|²: {(measurementResult.theoretical_p_zero * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Collapsed State 1 (Alternative Fuel / Eco Cruise):</span>
                  <span className="text-emerald-400 font-bold">
                    {measurementResult.measured_ones} times ({(measurementResult.empirical_frequency_one * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-navy-950 h-3 rounded-full overflow-hidden p-0.5 border border-navy-800">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-glow-emerald"
                    style={{ width: `${measurementResult.empirical_frequency_one * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Theoretical |β|²: {(measurementResult.theoretical_p_one * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* First 20 bits sample sequence register */}
            <div className="md:col-span-6 bg-navy-950/80 p-3.5 rounded-xl border border-navy-800">
              <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                Sample Measured Register Bits (First 20 Collapses):
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {measurementResult.sample_head_sequence.map((bit, idx) => (
                  <span
                    key={idx}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold border ${
                      bit === 1
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald'
                        : 'bg-cyan-brand/20 text-cyan-300 border-cyan-brand/40'
                    }`}
                  >
                    {bit}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Empirical Error (|f - p|): <b>{measurementResult.convergence_delta}</b></span>
                <span className="text-emerald-400 font-semibold">✓ Conforms to Law of Large Numbers</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs font-mono">
            Click "Simulate Collapse" to perform Monte Carlo quantum measurement at current angle θ = {thetaDeg.toFixed(1)}°.
          </div>
        )}
      </div>

      {/* Section 4: Shannon Entropy & Catastrophe Diversity Operator */}
      <div className="card-maritime p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-navy-750 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                Quantum Diversity & Hamming Entropy Catastrophe Operator
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Prevents QEA premature stagnation. When population entropy drops below 0.15, trapped bits are automatically re-energized into equal superposition.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCatastrophe(true)}
              disabled={simulatingCatastrophe}
              className="py-1.5 px-3 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Stagnation</span>
            </button>

            <button
              onClick={() => handleCatastrophe(false)}
              disabled={simulatingCatastrophe}
              className="btn-cyan py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-glow-cyan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Trigger Catastrophe Reset</span>
            </button>
          </div>
        </div>

        {catastropheResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-navy-950/70 p-3 rounded-lg border border-navy-800">
                <span className="text-[10px] text-slate-400 block">Population Entropy Before:</span>
                <span
                  className={`text-lg font-bold font-mono mt-0.5 block ${
                    catastropheResult.entropy_before < 0.15 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {catastropheResult.entropy_before} / 1.0000
                </span>
                <span className="text-[10px] text-slate-500">
                  {catastropheResult.entropy_before < 0.15 ? '⚠️ Trapped in Local Optima' : 'Normal Diversity'}
                </span>
              </div>

              <div className="bg-navy-950/70 p-3 rounded-lg border border-navy-800">
                <span className="text-[10px] text-slate-400 block">Catastrophe Operator Status:</span>
                <span
                  className={`text-sm font-bold font-mono mt-1 block ${
                    catastropheResult.catastrophe_triggered ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {catastropheResult.catastrophe_triggered ? '⚡ CATASTROPHE ACTIVATED' : 'Dormant (Entropy OK)'}
                </span>
                <span className="text-[10px] text-slate-500">Threshold: &lt; 0.15</span>
              </div>

              <div className="bg-navy-950/70 p-3 rounded-lg border border-navy-800">
                <span className="text-[10px] text-slate-400 block">Restored Entropy After:</span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                  {catastropheResult.entropy_after} / 1.0000
                </span>
                <span className="text-[10px] text-emerald-400">
                  +{catastropheResult.entropy_gain_pct}% Diversity Injected
                </span>
              </div>
            </div>

            {/* Q-Bit Chromosome Register Grid */}
            <div>
              <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                Chromosome Q-Bit Amplitudes (Showing first 8 genes):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {catastropheResult.bits_after.map((bit) => (
                  <div
                    key={bit.bit_index}
                    className={`p-2 rounded-lg border text-center font-mono ${
                      bit.reset_applied
                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-glow-emerald'
                        : 'bg-navy-950 border-navy-800'
                    }`}
                  >
                    <span className="text-[9px] text-slate-500 block">Bit #{bit.bit_index}</span>
                    <span className="text-xs font-bold text-white block">|β|²: {(bit.p_one * 100).toFixed(0)}%</span>
                    <span className="text-[9px] text-emerald-400 block">
                      {bit.reset_applied ? 'π/4 Reset' : 'Kept'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

