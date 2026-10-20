import React, { useState, useMemo } from 'react';
import { VisualSandboxId } from '../types/orbit';
import { RotateCcw, Sliders, Info, Layers } from 'lucide-react';

interface VisualLaboratoryProps {
  initialSandboxId?: VisualSandboxId;
  compactMode?: boolean;
}

export const VisualLaboratory: React.FC<VisualLaboratoryProps> = ({
  initialSandboxId = 'quantum_threshold',
  compactMode = false,
}) => {
  const [activeSandbox, setActiveSandbox] = useState<VisualSandboxId>(initialSandboxId);

  // 1. Quantum Surface Code Threshold Parameters
  const [physicalErrorPermille, setPhysicalErrorPermille] = useState<number>(1.4); // 0.14% default (Willow benchmark)
  const [codeDistance, setCodeDistance] = useState<number>(7); // d = 3, 5, 7, 9, 11
  const [syndromeCycles, setSyndromeCycles] = useState<number>(50);

  // 2. Hemoglobin Bohr Effect Parameters
  const [bloodPh, setBloodPh] = useState<number>(7.2); // Active muscle default
  const [pCo2MmHg, setPCo2MmHg] = useState<number>(55);
  const [tempCelsius, setTempCelsius] = useState<number>(38.5);

  // 3. FlashAttention & Sparse Scaling Parameters
  const [seqLengthK, setSeqLengthK] = useState<number>(64); // 64K tokens
  const [blockSparsityRatio, setBlockSparsityRatio] = useState<number>(75); // 75% skipped blocks
  const [headDim, setHeadDim] = useState<number>(128);

  // 4. Geospatial 3DGS / Repo Pipeline Stage Inspector
  const [activePipelineStage, setActivePipelineStage] = useState<number>(2);
  const [splatDensityK, setSplatDensityK] = useState<number>(850);

  // Quantum Math Calculation
  const quantumMetrics = useMemo(() => {
    const p = physicalErrorPermille / 1000; // e.g., 0.0014
    const pTh = 0.01; // 1.0% surface code threshold
    const lambda = pTh / Math.max(p, 0.0001);
    const distances = [3, 5, 7, 9, 11];
    const curve = distances.map((d) => {
      const logicalPerCycle = 0.03 * Math.pow(p / pTh, (d + 1) / 2);
      const survivalProb = Math.pow(Math.max(0, 1 - logicalPerCycle), syndromeCycles);
      return {
        d,
        physicalQubits: 2 * d * d - 1,
        logicalPerCycle: Math.min(logicalPerCycle, 0.5),
        survivalPercent: Math.max(0, Math.min(100, survivalProb * 100)),
      };
    });
    const selected = curve.find((c) => c.d === codeDistance) || curve[2];
    return {
      p,
      pTh,
      lambda,
      belowThreshold: p < pTh,
      curve,
      selected,
    };
  }, [physicalErrorPermille, codeDistance, syndromeCycles]);

  // Bohr Effect Math Calculation
  const bohrMetrics = useMemo(() => {
    // Baseline P50 at pH 7.4, PCO2 40, Temp 37°C is 26.6 mmHg
    const phFactor = Math.pow(10, -0.48 * (bloodPh - 7.4));
    const co2Factor = Math.pow(10, 0.06 * ((pCo2MmHg - 40) / 10));
    const tempFactor = Math.pow(10, 0.024 * (tempCelsius - 37));
    const shiftedP50 = 26.6 * phFactor * co2Factor * tempFactor;
    const n = 2.8;

    const po2Points = Array.from({ length: 21 }, (_, i) => i * 5); // 0 to 100 mmHg
    const points = po2Points.map((po2) => {
      const normalSat = (Math.pow(po2, n) / (Math.pow(26.6, n) + Math.pow(po2, n))) * 100;
      const shiftedSat = (Math.pow(po2, n) / (Math.pow(shiftedP50, n) + Math.pow(po2, n))) * 100;
      return { po2, normalSat, shiftedSat };
    });

    // At tissue PO2 = 40 mmHg
    const normalAt40 = points.find((pt) => pt.po2 === 40)?.normalSat ?? 75;
    const shiftedAt40 = points.find((pt) => pt.po2 === 40)?.shiftedSat ?? 55;
    const extraUnloaded = Math.max(0, normalAt40 - shiftedAt40);

    return {
      shiftedP50,
      points,
      normalAt40,
      shiftedAt40,
      extraUnloaded,
    };
  }, [bloodPh, pCo2MmHg, tempCelsius]);

  // Attention Memory Math Calculation
  const attentionMetrics = useMemo(() => {
    const N = seqLengthK * 1024;
    // Standard N x N FP16 attention matrix in GB (per layer, 32 heads)
    const standardMatrixGB = (32 * N * N * 2) / 1e9;
    // FlashAttention O(N) activation memory in GB
    const flashActivationGB = (32 * N * headDim * 2) / 1e9;
    // Compute speedup from block sparsity
    const effectiveFlopsRatio = 100 - blockSparsityRatio * 0.85;
    return {
      standardMatrixGB,
      flashActivationGB,
      memoryReductionFactor: Math.round(standardMatrixGB / Math.max(flashActivationGB, 0.001)),
      effectiveFlopsRatio,
    };
  }, [seqLengthK, blockSparsityRatio, headDim]);

  const resetCurrentSandbox = () => {
    if (activeSandbox === 'quantum_threshold') {
      setPhysicalErrorPermille(1.4);
      setCodeDistance(7);
      setSyndromeCycles(50);
    } else if (activeSandbox === 'hemoglobin_bohr') {
      setBloodPh(7.2);
      setPCo2MmHg(55);
      setTempCelsius(38.5);
    } else if (activeSandbox === 'sparse_attention') {
      setSeqLengthK(64);
      setBlockSparsityRatio(75);
      setHeadDim(128);
    } else {
      setActivePipelineStage(2);
      setSplatDensityK(850);
    }
  };

  return (
    <div className="orbit-glass-panel rounded-[26px] p-5 md:p-6 text-[#F4F3EF]">
      {/* Top Sandbox Selector & Provenance Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Contextual Visual Laboratory</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-mono">
              [Illustrative Mathematical Simulation + Empirical Reference Anchors]
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            Interactive Mechanism & Parameter Sandbox
          </h3>
        </div>

        {!compactMode && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/35 border border-white/10">
            {[
              { id: 'quantum_threshold', label: 'Quantum Threshold' },
              { id: 'hemoglobin_bohr', label: 'Bohr O2 Curve' },
              { id: 'sparse_attention', label: 'FlashAttention Scaling' },
              { id: 'repo_pipeline', label: '3DGS / Repo Architecture' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSandbox(tab.id as VisualSandboxId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeSandbox === tab.id
                    ? 'bg-white text-[#0B0A0E] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Two-Zone Sandbox Layout (65% Stage / 35% Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT STAGE: Interactive SVG Visualization (7 cols) */}
        <div className="lg:col-span-7 rounded-[20px] bg-[#0B0A10]/90 border border-white/10 p-5 flex flex-col justify-between min-h-[340px]">
          {activeSandbox === 'quantum_threshold' && (
            <>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs text-white/55">
                    Surface Code Scaling Law · Nature 638, 920–926 Benchmark
                  </span>
                  <h4 className="text-base font-semibold">
                    Logical Error per Cycle vs. Code Distance (d)
                  </h4>
                </div>
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                    quantumMetrics.belowThreshold
                      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-rose-300 border-rose-500/30 bg-rose-500/10'
                  }`}
                >
                  {quantumMetrics.belowThreshold
                    ? `● BELOW THRESHOLD (Λ = ${quantumMetrics.lambda.toFixed(2)}x)`
                    : `▲ ABOVE THRESHOLD (Λ = ${quantumMetrics.lambda.toFixed(2)}x)`}
                </span>
              </div>

              {/* SVG Chart */}
              <div className="my-auto py-2">
                <svg viewBox="0 0 520 220" className="w-full h-48 overflow-visible">
                  {/* Horizontal Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1="50"
                        y1={20 + t * 160}
                        x2="490"
                        y2={20 + t * 160}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 4"
                      />
                    </g>
                  ))}

                  {/* Bars & Curve for d=3,5,7,9,11 */}
                  {quantumMetrics.curve.map((pt, i) => {
                    const x = 90 + i * 90;
                    // Log scale mapping for error rate
                    const logVal = Math.max(-6, Math.log10(Math.max(pt.logicalPerCycle, 1e-6)));
                    const normHeight = ((logVal + 6) / 6) * 150;
                    const y = 180 - Math.max(8, Math.min(155, normHeight));
                    const isSelected = pt.d === codeDistance;
                    return (
                      <g key={pt.d} className="cursor-pointer" onClick={() => setCodeDistance(pt.d)}>
                        <rect
                          x={x - 20}
                          y={y}
                          width="40"
                          height={180 - y}
                          rx="6"
                          fill={
                            isSelected
                              ? quantumMetrics.belowThreshold
                                ? '#10B981'
                                : '#F43F5E'
                              : 'rgba(255,255,255,0.16)'
                          }
                        />
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          className="fill-white/85 text-[10px] font-mono"
                        >
                          {(pt.logicalPerCycle * 100).toExponential(1)}%
                        </text>
                        <text
                          x={x}
                          y="198"
                          textAnchor="middle"
                          className="fill-white/75 text-xs font-mono"
                        >
                          d={pt.d}
                        </text>
                        <text
                          x={x}
                          y="212"
                          textAnchor="middle"
                          className="fill-white/40 text-[10px] font-mono"
                        >
                          ({pt.physicalQubits}q)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/50 block">Physical Qubits (2d²-1)</span>
                  <span className="text-base font-mono font-semibold text-white">
                    {quantumMetrics.selected.physicalQubits} qubits
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Logical Error / Cycle</span>
                  <span className="text-base font-mono font-semibold text-emerald-300">
                    {(quantumMetrics.selected.logicalPerCycle * 100).toFixed(4)}%
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">
                    State Survival ({syndromeCycles} cycles)
                  </span>
                  <span className="text-base font-mono font-semibold text-white">
                    {quantumMetrics.selected.survivalPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </>
          )}

          {activeSandbox === 'hemoglobin_bohr' && (
            <>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs text-white/55">
                    Hill Allosteric Model · P50 Shift at Tissue PO2 = 40 mmHg
                  </span>
                  <h4 className="text-base font-semibold">
                    Oxygen-Hemoglobin Dissociation Curve (Bohr Shift)
                  </h4>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  P50 = {bohrMetrics.shiftedP50.toFixed(1)} mmHg (Baseline 26.6)
                </span>
              </div>

              <div className="my-auto py-2">
                <svg viewBox="0 0 520 220" className="w-full h-48 overflow-visible">
                  {/* Axes */}
                  <line x1="45" y1="180" x2="490" y2="180" stroke="rgba(255,255,255,0.25)" />
                  <line x1="45" y1="20" x2="45" y2="180" stroke="rgba(255,255,255,0.25)" />
                  {/* Tissue PO2 = 40 mmHg Reference Vertical Line */}
                  <line
                    x1={45 + (40 / 100) * 430}
                    y1="20"
                    x2={45 + (40 / 100) * 430}
                    y2="180"
                    stroke="rgba(56, 189, 248, 0.45)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={45 + (40 / 100) * 430}
                    y="14"
                    textAnchor="middle"
                    className="fill-sky-300 text-[10px] font-mono"
                  >
                    Active Tissue PO2 (40 mmHg)
                  </text>

                  {/* Baseline pH 7.4 Curve (Emerald) */}
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    points={bohrMetrics.points
                      .map(
                        (pt) =>
                          `${45 + (pt.po2 / 100) * 430},${180 - (pt.normalSat / 100) * 155}`
                      )
                      .join(' ')}
                  />

                  {/* Shifted Bohr Curve (Coral/Amber Dashed) */}
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    points={bohrMetrics.points
                      .map(
                        (pt) =>
                          `${45 + (pt.po2 / 100) * 430},${180 - (pt.shiftedSat / 100) * 155}`
                      )
                      .join(' ')}
                  />

                  <text x="260" y="205" textAnchor="middle" className="fill-white/60 text-xs font-mono">
                    Partial Pressure of Oxygen PO2 (0 → 100 mmHg)
                  </text>
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/50 block">Baseline Saturation (40 mmHg)</span>
                  <span className="text-base font-mono font-semibold text-emerald-300">
                    {bohrMetrics.normalAt40.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Shifted Saturation (40 mmHg)</span>
                  <span className="text-base font-mono font-semibold text-amber-300">
                    {bohrMetrics.shiftedAt40.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Extra O2 Unloaded to Tissue</span>
                  <span className="text-base font-mono font-semibold text-white">
                    +{bohrMetrics.extraUnloaded.toFixed(1)}% boost
                  </span>
                </div>
              </div>
            </>
          )}

          {activeSandbox === 'sparse_attention' && (
            <>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs text-white/55">
                    GPU Memory Hierarchy · HBM vs On-Chip SRAM Tiling
                  </span>
                  <h4 className="text-base font-semibold">
                    Attention Matrix Memory Footprint at N = {seqLengthK}K Tokens
                  </h4>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  {attentionMetrics.memoryReductionFactor}x Less HBM Memory
                </span>
              </div>

              <div className="my-auto grid grid-cols-2 gap-4 py-3">
                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
                  <span className="text-xs text-white/55 block mb-1">
                    Standard O(N²) Attention Matrix
                  </span>
                  <span className="text-2xl font-mono font-bold text-rose-400">
                    {attentionMetrics.standardMatrixGB.toFixed(1)} GB
                  </span>
                  <p className="text-xs text-white/60 mt-2">
                    Materializes full {seqLengthK}K × {seqLengthK}K score matrix in slow HBM. Exceeds 80GB H100 VRAM at long context.
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 p-4">
                  <span className="text-xs text-emerald-300/80 block mb-1">
                    FlashAttention Online SRAM Tiling
                  </span>
                  <span className="text-2xl font-mono font-bold text-emerald-300">
                    {attentionMetrics.flashActivationGB.toFixed(2)} GB
                  </span>
                  <p className="text-xs text-white/70 mt-2">
                    Streams K/V blocks through 256KB on-chip SRAM using online softmax rescaling without N² allocation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/50 block">Context Length (N)</span>
                  <span className="text-base font-mono font-semibold text-white">
                    {(seqLengthK * 1024).toLocaleString()} tokens
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Block Sparsity Skipped</span>
                  <span className="text-base font-mono font-semibold text-emerald-300">
                    {blockSparsityRatio}% tiles skipped
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Relative Compute Load</span>
                  <span className="text-base font-mono font-semibold text-white">
                    {attentionMetrics.effectiveFlopsRatio.toFixed(1)}% of dense
                  </span>
                </div>
              </div>
            </>
          )}

          {activeSandbox === 'repo_pipeline' && (
            <>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs text-white/55">
                    Spatial Reconstruction Architecture · bilawalsidhu/gods-eye-view
                  </span>
                  <h4 className="text-base font-semibold">
                    Interactive 4-Stage 3D Gaussian Splatting Dataflow
                  </h4>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-300">
                  Stage {activePipelineStage + 1} of 4 Active
                </span>
              </div>

              <div className="my-auto grid grid-cols-1 sm:grid-cols-4 gap-2.5 py-2">
                {[
                  {
                    step: '01. Frame Sampler',
                    tool: 'FFmpeg / Masking',
                    desc: 'Extracts low-blur keyframes & removes moving pedestrians/cars.',
                  },
                  {
                    step: '02. Camera Pose SfM',
                    tool: 'COLMAP / GLOMAP',
                    desc: 'Solves intrinsic K, extrinsic [R|t] & sparse 3D point cloud.',
                  },
                  {
                    step: '03. Gaussian Trainer',
                    tool: 'CUDA Tile Rasterizer',
                    desc: 'Optimizes 3D covariance Σ, opacity α & spherical harmonics.',
                  },
                  {
                    step: '04. Real-Time Viewer',
                    tool: 'WebGL .splat / .ply',
                    desc: 'Renders sorted 2D projected splats at >60 FPS in browser.',
                  },
                ].map((node, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePipelineStage(idx)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      activePipelineStage === idx
                        ? 'bg-white/15 border-white/40 shadow-md'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span className="text-[11px] font-mono text-emerald-300 block">
                      {node.step}
                    </span>
                    <span className="text-xs font-semibold text-white block mt-0.5">
                      {node.tool}
                    </span>
                    <p className="text-[11px] text-white/65 mt-2 leading-relaxed">
                      {node.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/50 block">Gaussian Count</span>
                  <span className="text-base font-mono font-semibold text-white">
                    {splatDensityK.toLocaleString()},000 splats
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Estimated .ply File Size</span>
                  <span className="text-base font-mono font-semibold text-amber-300">
                    {Math.round(splatDensityK * 0.24)} MB (raw) / {Math.round(splatDensityK * 0.032)} MB (.splat)
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Target VRAM Budget</span>
                  <span className="text-base font-mono font-semibold text-emerald-300">
                    {(2.2 + splatDensityK * 0.0045).toFixed(1)} GB VRAM
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT CONTROLS: Parameter Sliders & Formula Deck (5 cols) */}
        <div className="lg:col-span-5 rounded-[20px] bg-white/[0.04] border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Interactive Parameter Controls</span>
              </div>
              <button
                onClick={resetCurrentSandbox}
                className="inline-flex items-center gap-1.5 text-xs text-white/65 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {activeSandbox === 'quantum_threshold' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Physical Two-Qubit Gate Error (p)</span>
                    <span className="font-mono text-emerald-300">
                      {(physicalErrorPermille / 10).toFixed(2)}% (Threshold: 1.00%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="14"
                    step="0.1"
                    value={physicalErrorPermille}
                    onChange={(e) => setPhysicalErrorPermille(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-white/45 font-mono mt-1">
                    <span>0.05% (Ideal)</span>
                    <span>0.14% (Willow)</span>
                    <span>1.40% (Above p_th)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Surface Code Distance (d)</span>
                    <span className="font-mono text-white">d = {codeDistance}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[3, 5, 7, 9, 11].map((d) => (
                      <button
                        key={d}
                        onClick={() => setCodeDistance(d)}
                        className={`py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                          codeDistance === d
                            ? 'bg-white text-[#0B0A0E] border-white font-semibold'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        d={d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Syndrome Extraction Cycles</span>
                    <span className="font-mono text-white">{syndromeCycles} cycles</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={syndromeCycles}
                    onChange={(e) => setSyndromeCycles(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeSandbox === 'hemoglobin_bohr' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Capillary Blood pH</span>
                    <span className="font-mono text-amber-300">pH {bloodPh.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="6.9"
                    max="7.6"
                    step="0.05"
                    value={bloodPh}
                    onChange={(e) => setBloodPh(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-white/45 font-mono mt-1">
                    <span>6.90 (Severe Acidosis)</span>
                    <span>7.40 (Arterial Normal)</span>
                    <span>7.60 (Alkalosis)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Tissue CO2 Partial Pressure (PCO2)</span>
                    <span className="font-mono text-white">{pCo2MmHg} mmHg</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="80"
                    step="5"
                    value={pCo2MmHg}
                    onChange={(e) => setPCo2MmHg(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Muscle Temperature</span>
                    <span className="font-mono text-white">{tempCelsius.toFixed(1)} °C</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="41"
                    step="0.5"
                    value={tempCelsius}
                    onChange={(e) => setTempCelsius(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeSandbox === 'sparse_attention' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Sequence Context Length (N)</span>
                    <span className="font-mono text-emerald-300">{seqLengthK}K tokens</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="128"
                    step="4"
                    value={seqLengthK}
                    onChange={(e) => setSeqLengthK(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">Block-Sparse Zero-Tile Ratio</span>
                    <span className="font-mono text-white">{blockSparsityRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={blockSparsityRatio}
                    onChange={(e) => setBlockSparsityRatio(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeSandbox === 'repo_pipeline' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/75">3D Gaussian Splat Density</span>
                    <span className="font-mono text-sky-300">{splatDensityK}K Gaussians</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2500"
                    step="50"
                    value={splatDensityK}
                    onChange={(e) => setSplatDensityK(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Click any of the 4 pipeline stages on the left to inspect how raw video frames are solved via COLMAP and rasterized into `.splat` primitives.
                </p>
              </div>
            )}
          </div>

          {/* Epistemic Provenance Notice */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-white/60">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white/85">Epistemic Distinction:</strong> Interactive curves compute analytical scaling equations in real time so you can test boundary conditions (e.g., pushing physical error <code>p</code> above threshold <code>p_th</code>). Anchor points are calibrated to published primary literature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
