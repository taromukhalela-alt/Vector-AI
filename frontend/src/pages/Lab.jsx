import { useState } from 'react';
import { motion } from 'framer-motion';
import PhysicsCanvas from '../components/PhysicsCanvas';
import {
  Play, Pause, ArrowCounterClockwise, Lightning,
  Planet, Circle, Cube, Clock, WaveSine, Rocket, Sparkle,
  SlidersHorizontal, ChartBar
} from '@phosphor-icons/react';

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
    { id: 'idle', label: 'Idle field', icon: Sparkle, color: 'bg-[var(--surface-muted)]' },
    { id: 'projectile', label: 'Projectile motion', icon: Rocket, color: 'bg-[var(--emerald)] text-[#0B1410]' },
    { id: 'wave', label: 'Wave motion', icon: WaveSine, color: 'bg-[var(--lab-aqua)] text-[#111]' },
    { id: 'pendulum', label: 'Harmonic pendulum', icon: Clock, color: 'bg-[var(--warning)] text-[#111]' },
    { id: 'forces', label: 'Forces & friction', icon: Cube, color: 'bg-[var(--lab-forge)] text-[#111]' },
    { id: 'collision', label: 'Collisions', icon: Circle, color: 'bg-[var(--magenta)] text-white' },
    { id: 'orbit', label: 'Orbits', icon: Planet, color: 'bg-[var(--lab-steel)] text-white' },
    { id: 'electricity', label: 'Electric field', icon: Lightning, color: 'bg-[var(--ink)] text-[var(--paper)]' },
  ];

  const handleParamChange = (key, value) => setParams(prev => ({ ...prev, [key]: value }));
  const handleReset = () => onAnimChange(activeAnim);

  const Slider = ({ label, unit, min, max, step, value, onChange }) => (
    <div className="mb-4 flex flex-col gap-1">
      <div className="flex items-end justify-between">
        <label className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">
          {label}
        </label>
        <span className="lab-readout border-2 border-[var(--border)] px-1 text-xs font-bold text-[var(--ink)] shadow-[1px_1px_0_var(--border)]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="neo-range h-2 w-full cursor-pointer appearance-none border-2 border-[var(--border)] bg-[var(--surface-muted)]"
      />
    </div>
  );

  const Toggle = ({ active, onClick, label }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`neo-btn neo-btn-sm mb-4 flex w-full items-center justify-center py-2 text-xs ${
        active
          ? 'bg-[var(--lab-steel)] text-white'
          : 'bg-[var(--surface)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="app-page-padded flex h-full flex-col overflow-y-auto bg-[var(--paper)] text-[var(--ink)]">

      {/* HEADER */}
      <div className="mb-6 flex flex-col justify-between border-b-[3px] border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <p className="section-label mb-2">Vector Lab Workspace · Scientific Instrumentation</p>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight md:text-5xl">Physics Lab</h1>
        </div>

        <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2 md:mt-0 md:pb-0" role="tablist" aria-label="Experiments">
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = activeAnim === lab.id;
            return (
              <button
                key={lab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onAnimChange(lab.id)}
                className={`flex flex-shrink-0 items-center gap-2 border-2 border-[var(--border)] px-3 py-2 text-xs font-bold uppercase transition-all ${
                  isActive
                    ? `${lab.color} shadow-[2px_2px_0_var(--border)]`
                    : 'bg-[var(--surface)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                <Icon className="h-4 w-4" weight="bold" aria-hidden="true" />
                {lab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LAB GRID */}
      <div className="flex min-h-[500px] flex-1 flex-col gap-6 lg:grid lg:grid-cols-[1fr_300px]">

        {/* CANVAS AREA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} className="neo-panel relative flex min-h-[400px] flex-1 flex-col overflow-hidden">
          {/* Internal HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
            <div className="border-2 border-[var(--border)] bg-[var(--surface)] p-2 shadow-[2px_2px_0_var(--border)]">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--ink)]">
                <span className="block h-2 w-2 border border-[var(--border)] bg-[var(--lab-aqua)]" /> HUD
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">{hudTitle}</h3>
              <p className="lab-readout text-xs font-bold text-[var(--ink-muted)]">{hudFormula}</p>
            </div>

            <div className="hidden border-2 border-[var(--border)] bg-[var(--danger)] p-2 text-white shadow-[2px_2px_0_var(--border)] sm:block">
               <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                 <WaveSine className="h-3 w-3" weight="bold" aria-hidden="true" /> LIVE
               </div>
            </div>
          </div>

          <div className="relative w-full flex-1">
            <PhysicsCanvas
              animationId={activeAnim}
              params={params}
              speed={speed}
              isPaused={isPaused}
              onReadoutUpdate={setReadout}
              onHUDUpdate={(title, formula) => { setHudTitle(title); setHudFormula(formula); }}
            />
          </div>

          {/* TELEMETRY BAR */}
          <div className="overflow-x-auto border-t-[3px] border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex min-w-max items-center gap-6">
              <div className="section-label flex items-center gap-2">
                <ChartBar className="h-4 w-4" weight="bold" aria-hidden="true" /> Telemetry
              </div>
              {Object.entries(readout).length > 0 ? (
                Object.entries(readout).map(([key, value]) => (
                  <div key={key} className="lab-dial flex items-center gap-3 px-3 py-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ink-muted)]">{key}</span>
                    <span className="lab-readout text-sm font-bold text-[var(--ink)]">{String(value)}</span>
                  </div>
                ))
              ) : (
                <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">AWAITING SIGNAL — RUN AN EXPERIMENT</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CONTROL DECK */}
        <div className="neo-panel flex flex-shrink-0 flex-col">
          <div className="flex items-center gap-2 border-b-[3px] border-[var(--border)] bg-[var(--ink)] p-4 text-[var(--paper)]">
            <SlidersHorizontal className="h-5 w-5" weight="bold" aria-hidden="true" />
            <h3 className="text-sm font-black uppercase tracking-widest">Instrument Control</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeAnim === 'idle' && (
              <p className="p-2 text-sm font-bold leading-relaxed text-[var(--ink-muted)]">
                Select an experiment from the workspace tabs to load its mechanical controls.
              </p>
            )}
            
            {activeAnim === 'projectile' && (
              <>
                <Slider label="Angle" unit="°" min={10} max={80} step={1} value={params.angle} onChange={(v) => handleParamChange('angle', v)} />
                <Slider label="Velocity" unit=" m/s" min={5} max={25} step={0.5} value={params.velocity} onChange={(v) => handleParamChange('velocity', v)} />
                <Slider label="Bounce" unit="" min={0} max={0.9} step={0.05} value={params.bounciness.toFixed(2)} onChange={(v) => handleParamChange('bounciness', v)} />
                <Slider label="Height" unit="m" min={0} max={5} step={0.5} value={params.height} onChange={(v) => handleParamChange('height', v)} />
                <Toggle active={params.vectors} onClick={() => handleParamChange('vectors', !params.vectors)} label="Show Vectors" />
              </>
            )}
            {activeAnim === 'wave' && (
              <>
                <Slider label="Frequency" unit=" Hz" min={0.5} max={3.0} step={0.1} value={params.frequency} onChange={(v) => handleParamChange('frequency', v)} />
                <Slider label="Amplitude" unit="m" min={0.5} max={2.5} step={0.1} value={params.amplitude} onChange={(v) => handleParamChange('amplitude', v)} />
                <Toggle active={params.superposition} onClick={() => handleParamChange('superposition', !params.superposition)} label="Superposition" />
              </>
            )}
            {activeAnim === 'pendulum' && (
              <>
                <Slider label="Length" unit="m" min={2} max={8} step={0.2} value={params.length} onChange={(v) => handleParamChange('length', v)} />
                <Slider label="Angle" unit="°" min={10} max={75} step={1} value={params.angle ?? 30} onChange={(v) => handleParamChange('angle', v)} />
                <Toggle active={params.vectors} onClick={() => handleParamChange('vectors', !params.vectors)} label="Show Vectors" />
              </>
            )}
            {activeAnim === 'forces' && (
              <>
                <Slider label="Applied Force" unit=" N" min={-50} max={50} step={1} value={params.applied} onChange={(v) => handleParamChange('applied', v)} />
                <Slider label="Friction (μ)" unit="" min={0} max={0.8} step={0.05} value={params.mu.toFixed(2)} onChange={(v) => handleParamChange('mu', v)} />
                <Slider label="Mass" unit=" kg" min={1} max={20} step={0.5} value={params.mass} onChange={(v) => handleParamChange('mass', v)} />
                <Toggle active={params.vectors} onClick={() => handleParamChange('vectors', !params.vectors)} label="Show Vectors" />
              </>
            )}
            {activeAnim === 'collision' && (
              <>
                <Slider label="Mass A" unit=" kg" min={1} max={10} step={0.5} value={params.mass1} onChange={(v) => handleParamChange('mass1', v)} />
                <Slider label="Mass B" unit=" kg" min={1} max={10} step={0.5} value={params.mass2} onChange={(v) => handleParamChange('mass2', v)} />
                <Toggle active={params.elastic} onClick={() => handleParamChange('elastic', !params.elastic)} label={params.elastic ? 'Elastic Collision' : 'Inelastic Collision'} />
              </>
            )}
            {activeAnim === 'orbit' && (
              <Slider label="Eccentricity" unit="" min={0} max={0.85} step={0.05} value={params.eccentricity} onChange={(v) => handleParamChange('eccentricity', v)} />
            )}
            {activeAnim === 'electricity' && (
              <Slider label="Separation" unit=" m" min={2} max={10} step={0.5} value={params.separation} onChange={(v) => handleParamChange('separation', v)} />
            )}

            <div className="mt-8 pt-4 border-t-2 border-[var(--border)]">
              <Slider label="Time Scale" unit="x" min={0.25} max={2.0} step={0.05} value={speed} onChange={(v) => setSpeed(v)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t-[3px] border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-pressed={isPaused}
              className="neo-btn neo-btn-sm flex items-center justify-center gap-2 py-3"
            >
              {isPaused ? <Play className="h-4 w-4" weight="fill" aria-hidden="true" /> : <Pause className="h-4 w-4" weight="fill" aria-hidden="true" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleReset}
              className="neo-btn neo-btn-sm neo-btn-danger flex items-center justify-center gap-2 py-3"
            >
              <ArrowCounterClockwise className="h-4 w-4" weight="bold" aria-hidden="true" /> Reset
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Lab;
