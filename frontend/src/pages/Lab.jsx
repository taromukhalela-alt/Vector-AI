import { useState } from 'react';
import PhysicsCanvas from '../components/PhysicsCanvas';
import {
  Play, Pause, RotateCcw, Zap,
  Orbit, CircleDot, Box, Clock, Activity, Rocket, Sparkles, SlidersHorizontal, BarChart2
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

  const Slider = ({ label, unit, min, max, step, value, onChange }) => (
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex justify-between items-end">
        <label className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">
          {label}
        </label>
        <span className="text-xs font-bold font-mono text-[var(--ink-muted)] border-2 border-[var(--border)] px-1 shadow-[1px_1px_0_var(--border)]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--emerald)] h-2 border-2 border-[var(--border)] rounded-none cursor-pointer appearance-none bg-[var(--surface-muted)]"
      />
    </div>
  );

  const Toggle = ({ active, onClick, label }) => (
    <button
      onClick={onClick}
      className={`w-full neo-btn py-2 text-xs flex items-center justify-center shadow-[2px_2px_0_var(--border)] mb-4 ${
        active
          ? 'bg-[var(--emerald)] text-white'
          : 'bg-[var(--surface)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[var(--paper)] text-[var(--ink)] p-4 md:p-6 overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-[var(--border)] pb-6 mb-6">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink-muted)] mb-2">Vector Lab Workspace</h2>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Physics Lab</h1>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = activeAnim === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => onAnimChange(lab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 border-2 border-[var(--border)] font-bold uppercase text-xs transition-all ${
                  isActive
                    ? 'bg-[var(--emerald)] text-white shadow-[2px_2px_0_var(--border)] translate-y-[-2px]'
                    : 'bg-[var(--surface)] hover:bg-[var(--surface-muted)] hover:translate-y-[-2px] hover:shadow-[2px_2px_0_var(--border)]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {lab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LAB GRID */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6 flex-1 min-h-[500px]">
        
        {/* CANVAS AREA */}
        <div className="flex flex-col border-4 border-[var(--border)] bg-[var(--surface)] shadow-[6px_6px_0_var(--border)] relative overflow-hidden flex-1 min-h-[400px]">
          {/* Internal HUD */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-10">
            <div className="border-2 border-[var(--border)] bg-[var(--surface)] p-2 shadow-[2px_2px_0_var(--border)]">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--emerald)] mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--emerald)] block rounded-none border border-[var(--border)]" /> HUD
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">{hudTitle}</h3>
              <p className="font-mono text-xs font-bold text-[var(--ink-muted)]">{hudFormula}</p>
            </div>
            
            <div className="border-2 border-[var(--border)] bg-[var(--surface)] p-2 shadow-[2px_2px_0_var(--border)] hidden sm:block">
               <div className="text-[10px] font-black uppercase tracking-widest text-[var(--danger)] flex items-center gap-1">
                 <Activity className="w-3 h-3" /> LIVE
               </div>
            </div>
          </div>

          <div className="flex-1 w-full relative">
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
          <div className="border-t-4 border-[var(--border)] bg-[var(--surface-muted)] p-4 overflow-x-auto">
            <div className="flex items-center gap-6 min-w-max">
              <div className="text-xs font-black uppercase tracking-widest text-[var(--ink-muted)] flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Telemetry
              </div>
              {Object.keys(readout).length > 0 ? (
                Object.entries(readout).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[var(--ink)]">{key}</span>
                    <span className="font-mono text-xs font-bold bg-[var(--surface)] border-2 border-[var(--border)] px-2 py-0.5 shadow-[1px_1px_0_var(--border)]">{val}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs font-bold text-[var(--ink-muted)] italic">Awaiting data...</span>
              )}
            </div>
          </div>
        </div>

        {/* PARAMETERS PANEL */}
        <div className="flex flex-col border-4 border-[var(--border)] bg-[var(--surface)] shadow-[6px_6px_0_var(--border)] flex-shrink-0">
          <div className="p-4 border-b-4 border-[var(--border)] bg-[var(--surface-muted)] flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[var(--ink)]" />
            <h2 className="text-sm font-black uppercase tracking-widest">Parameters</h2>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {activeAnim === 'idle' && (
              <p className="text-xs font-bold text-[var(--ink-muted)] uppercase">Select a simulation to adjust parameters.</p>
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

          <div className="p-4 border-t-4 border-[var(--border)] bg-[var(--surface-muted)] grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="neo-btn flex items-center justify-center gap-2 py-3 shadow-[2px_2px_0_var(--border)]"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleReset}
              className="neo-btn bg-[var(--danger)] text-white flex items-center justify-center gap-2 py-3 shadow-[2px_2px_0_var(--border)]"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Lab;
