import { useState } from 'react';
import PhysicsCanvas from '../components/PhysicsCanvas';
import {
  Play, Pause, RotateCcw, Zap,
  Orbit, CircleDot, Box, Clock, Activity, Rocket, Sparkles
} from 'lucide-react';

const Lab = ({ activeAnim = 'idle', onAnimChange }) => {
  const [speed, setSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [hudTitle, setHudTitle] = useState('Select a visual lab');
  const [hudFormula, setHudFormula] = useState('Explore physics in real-time');
  const [readout, setReadout] = useState({});

  const [params, setParams] = useState({
    angle: 45, velocity: 14, bounciness: 0.6, height: 0, vectors: true,
    frequency: 1.2, amplitude: 1.5, superposition: false,
    length: 5,
    applied: 20, mu: 0.3, mass: 5,
    mass1: 3, mass2: 3, elastic: true,
    eccentricity: 0.3,
    separation: 6,
  });

  const labs = [
    { id: 'idle', label: 'Idle field', icon: Sparkles },
    { id: 'projectile', label: 'Projectile motion', icon: Rocket },
    { id: 'wave', label: 'Wave motion', icon: Activity },
    { id: 'pendulum', label: 'Harmonic pendulum', icon: Clock },
    { id: 'forces', label: 'Forces & friction', icon: Box },
    { id: 'collision', label: 'Collisions', icon: CircleDot },
    { id: 'orbit', label: 'Orbits', icon: Orbit },
    { id: 'electricity', label: 'Electric field', icon: Zap },
  ];

  const handleParamChange = (key, value) => setParams(prev => ({ ...prev, [key]: value }));
  const handleReset = () => onAnimChange(activeAnim);

  const Slider = ({ label, unit, min, max, step, value, onChange, wide }) => (
    <div className="flex items-center gap-2.5">
      <label className="text-[11px] font-medium text-zinc-400 w-[88px] text-right tabular-nums">
        {label} <span className="text-zinc-500">({value}{unit})</span>
      </label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`accent-emerald-500 h-1 rounded-full bg-white/[0.07] cursor-pointer ${wide ? 'flex-1 sm:w-32' : 'flex-1 sm:w-24'}`}
      />
    </div>
  );

  const Toggle = ({ active, onClick, label }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
        active
          ? 'bg-emerald-500/[0.12] border border-emerald-500/25 text-emerald-300'
          : 'bg-white/[0.03] border border-white/[0.07] text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col sm:flex z-20 bg-zinc-950/95 border-r border-white/[0.05] backdrop-blur-md">
        <div className="p-4 border-b border-white/[0.05]">
          <div className="text-[11px] font-semibold text-zinc-100">Visual labs</div>
          <div className="text-[10.5px] text-zinc-500 mt-0.5">{labs.length} simulations</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = activeAnim === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => onAnimChange(lab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.8} />
                {lab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main viewport */}
      <div
        className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.06] blur-[120px] pointer-events-none"
          style={{ width: 'min(600px, 90vw)', height: 'min(600px, 90vw)' }}
        />

        {/* HUD top-left */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-1.5rem)] sm:left-5 sm:top-5 sm:max-w-md rounded-xl bg-zinc-950/85 border border-white/[0.06] backdrop-blur-md px-4 py-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
          <div className="text-[9.5px] font-semibold text-emerald-400 uppercase tracking-[0.16em] flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            HUD
          </div>
          <h3 className="text-[14px] font-semibold text-zinc-100 tracking-tight leading-tight">{hudTitle}</h3>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-zinc-400 truncate sm:whitespace-normal">{hudFormula}</p>
        </div>

        {/* Telemetry top-right */}
        {Object.keys(readout).length > 0 && (
          <div className="absolute top-5 right-5 z-20 pointer-events-none px-4 py-3 rounded-xl hidden sm:block bg-zinc-950/85 border border-white/[0.06] min-w-[180px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="text-[9.5px] font-semibold text-zinc-500 uppercase tracking-[0.16em] mb-2">Telemetry</div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {Object.entries(readout).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-6 items-center">
                  <span className="text-zinc-500 capitalize">{key}</span>
                  <span className="text-emerald-300 tabular-nums">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <PhysicsCanvas
            animationId={activeAnim}
            params={params}
            speed={speed}
            isPaused={isPaused}
            onReadoutUpdate={setReadout}
            onHUDUpdate={(title, formula) => { setHudTitle(title); setHudFormula(formula); }}
          />
        </div>

        {/* Controls overlay */}
        <div className="relative z-20 max-h-[45%] shrink-0 overflow-y-auto bg-zinc-950/95 border-t border-white/[0.05] backdrop-blur-md p-4 sm:p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            <select
              value={activeAnim}
              onChange={(e) => onAnimChange(e.target.value)}
              className="w-full rounded-lg border border-white/[0.07] bg-zinc-900/60 px-3 py-2 text-[13px] font-medium focus:outline-none sm:hidden"
            >
              {labs.map((lab) => <option key={lab.id} value={lab.id}>{lab.label}</option>)}
            </select>

            <div className="flex flex-col sm:flex-wrap sm:flex-row sm:items-center gap-3 sm:justify-center">
              {activeAnim === 'projectile' && (
                <>
                  <Slider label="Angle" unit="°" min={10} max={80} step={1} value={params.angle} onChange={(v) => handleParamChange('angle', v)} />
                  <Slider label="Vel" unit="m/s" min={5} max={25} step={0.5} value={params.velocity} onChange={(v) => handleParamChange('velocity', v)} />
                  <Slider label="Bounce" unit="" min={0} max={0.9} step={0.05} value={params.bounciness.toFixed(2)} onChange={(v) => handleParamChange('bounciness', v)} />
                  <Slider label="Height" unit="m" min={0} max={5} step={0.5} value={params.height} onChange={(v) => handleParamChange('height', v)} />
                  <Toggle active={params.vectors} onClick={() => handleParamChange('vectors', !params.vectors)} label="Vectors" />
                </>
              )}
              {activeAnim === 'wave' && (
                <>
                  <Slider wide label="Freq" unit=" Hz" min={0.5} max={3.0} step={0.1} value={params.frequency} onChange={(v) => handleParamChange('frequency', v)} />
                  <Slider wide label="Amp" unit="m" min={0.5} max={2.5} step={0.1} value={params.amplitude} onChange={(v) => handleParamChange('amplitude', v)} />
                  <Toggle active={params.superposition} onClick={() => handleParamChange('superposition', !params.superposition)} label="Superposition" />
                </>
              )}
              {activeAnim === 'pendulum' && (
                <>
                  <Slider wide label="Length" unit="m" min={2} max={8} step={0.2} value={params.length} onChange={(v) => handleParamChange('length', v)} />
                  <Slider wide label="Angle" unit="°" min={10} max={75} step={1} value={params.angle ?? 30} onChange={(v) => handleParamChange('angle', v)} />
                  <Toggle active={params.vectors} onClick={() => handleParamChange('vectors', !params.vectors)} label="Vectors" />
                </>
              )}
              {activeAnim === 'forces' && (
                <>
                  <Slider wide label="Force" unit=" N" min={-50} max={50} step={1} value={params.applied} onChange={(v) => handleParamChange('applied', v)} />
                  <Slider label="μ" unit="" min={0} max={0.8} step={0.05} value={params.mu.toFixed(2)} onChange={(v) => handleParamChange('mu', v)} />
                  <Slider label="Mass" unit=" kg" min={1} max={20} step={0.5} value={params.mass} onChange={(v) => handleParamChange('mass', v)} />
                  <Toggle active={params.vectors} onClick={() => handleParamChange('vectors', !params.vectors)} label="Vectors" />
                </>
              )}
              {activeAnim === 'collision' && (
                <>
                  <Slider label="Mass A" unit=" kg" min={1} max={10} step={0.5} value={params.mass1} onChange={(v) => handleParamChange('mass1', v)} />
                  <Slider label="Mass B" unit=" kg" min={1} max={10} step={0.5} value={params.mass2} onChange={(v) => handleParamChange('mass2', v)} />
                  <Toggle active={params.elastic} onClick={() => handleParamChange('elastic', !params.elastic)} label={params.elastic ? 'Elastic' : 'Inelastic'} />
                </>
              )}
              {activeAnim === 'orbit' && (
                <Slider wide label="Eccentricity" unit="" min={0} max={0.85} step={0.05} value={params.eccentricity} onChange={(v) => handleParamChange('eccentricity', v)} />
              )}
              {activeAnim === 'electricity' && (
                <Slider wide label="Separation" unit=" m" min={2} max={10} step={0.5} value={params.separation} onChange={(v) => handleParamChange('separation', v)} />
              )}
            </div>

            {/* Global controls */}
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <label className="text-[11px] font-medium text-zinc-400">Speed <span className="text-emerald-400 tabular-nums">({speed}x)</span></label>
                <input
                  type="range" min="0.25" max="2.0" step="0.05" value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="accent-emerald-500 h-1 rounded-full bg-white/[0.07] w-28 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-white/[0.04] border border-white/[0.07] text-zinc-200 hover:bg-white/[0.07] transition-colors"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-red-300 hover:bg-red-500/[0.08] hover:border-red-500/20 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lab;
