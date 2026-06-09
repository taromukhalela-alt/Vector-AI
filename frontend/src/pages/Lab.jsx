import { useState } from 'react';
import PhysicsCanvas from '../components/PhysicsCanvas';
import {
  Play, Pause, RotateCcw, Zap,
  Orbit, CircleDot, Box, Clock, Activity, Rocket, Sparkles
} from 'lucide-react';

const Lab = ({ activeAnim = 'idle', onAnimChange }) => {
  const [speed, setSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  
  // Custom HUD states
  const [hudTitle, setHudTitle] = useState('Select a Visual Lab');
  const [hudFormula, setHudFormula] = useState('Explore physics in real-time');
  const [readout, setReadout] = useState({});

  // Parameters states for all labs
  const [params, setParams] = useState({
    // projectile
    angle: 45,
    velocity: 14,
    bounciness: 0.6,
    height: 0,
    vectors: true,
    // wave
    frequency: 1.2,
    amplitude: 1.5,
    superposition: false,
    // pendulum
    length: 5,
    // forces
    applied: 20,
    mu: 0.3,
    mass: 5,
    // collision
    mass1: 3,
    mass2: 3,
    elastic: true,
    // orbit
    eccentricity: 0.3,
    // electricity
    separation: 6,
  });

  const labs = [
    { id: 'idle', label: 'Idle Field', icon: Sparkles },
    { id: 'projectile', label: 'Projectile Motion', icon: Rocket },
    { id: 'wave', label: 'Wave Motion', icon: Activity },
    { id: 'pendulum', label: 'Harmonic Pendulum', icon: Clock },
    { id: 'forces', label: 'Forces & Friction', icon: Box },
    { id: 'collision', label: 'Collisions', icon: CircleDot },
    { id: 'orbit', label: 'Orbits', icon: Orbit },
    { id: 'electricity', label: 'Electric Field', icon: Zap },
  ];

  const handleParamChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    // Re-trigger reload on canvas
    onAnimChange(activeAnim);
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 light:bg-zinc-50 light:text-zinc-950">
      
      {/* ── Simulation Selector Sidebar ── */}
      <aside className="hidden w-56 shrink-0 flex-col sm:flex z-20 bg-zinc-950/95 border-r border-zinc-800/40 backdrop-blur-md dark:bg-zinc-950/95 dark:border-zinc-800/40 light:bg-white/90 light:border-zinc-200/30">
        <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Visual Labs</h2>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = activeAnim === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => onAnimChange(lab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover-lift"
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(45,212,191,0.08))',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.22)',
                } : {
                  background: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e4e4e7'; } }}
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {lab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Viewport Container ── */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950 sci-grid-sm">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"
          style={{ width: 'min(600px, 90vw)', height: 'min(600px, 90vw)' }}
        />

        {/* HUD Display (floating top-left) */}
        <div className="pointer-events-none absolute left-2 top-2 z-20 max-w-[calc(100%-1rem)] rounded-lg sm:left-4 sm:top-4 sm:max-w-md sm:rounded-xl anim-fade-in bg-zinc-950/90 border border-zinc-800/40 p-2.5 sm:p-4 shadow-xl backdrop-blur-md dark:bg-zinc-950/90 dark:border-zinc-800/40 light:bg-white/90 light:border-zinc-200/30">
          <div className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5 flex items-center gap-1">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            HUD
          </div>
          <h3 className="font-extrabold text-xs sm:text-base uppercase tracking-wider text-zinc-100 leading-tight">{hudTitle}</h3>
          <p className="mt-0.5 sm:mt-1 max-w-full truncate font-mono text-[8px] sm:text-[11px] leading-relaxed text-zinc-400 sm:whitespace-normal font-semibold">{hudFormula}</p>
        </div>

        {/* Readout stats box (floating top-right) */}
        {Object.keys(readout).length > 0 && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none p-4 rounded-xl hidden sm:block anim-fade-in bg-zinc-950/90 border border-zinc-800/40 min-w-[160px] shadow-xl backdrop-blur-md dark:bg-zinc-950/90 dark:border-zinc-800/40 light:bg-white/90 light:border-zinc-200/30">
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 leading-none">Telemetry Readout</div>
            <div className="space-y-2 font-mono text-[10px] font-bold tracking-wide">
              {Object.entries(readout).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-6 items-center">
                  <span className="text-zinc-400 uppercase">{key}</span>
                  <span className="text-emerald-400 tabular-nums">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <PhysicsCanvas
            animationId={activeAnim}
            params={params}
            speed={speed}
            isPaused={isPaused}
            onReadoutUpdate={setReadout}
            onHUDUpdate={(title, formula) => {
              setHudTitle(title);
              setHudFormula(formula);
            }}
          />
        </div>

        {/* ── Controls Overlay Panel (bottom) ── */}
        <div className="relative z-20 max-h-[40%] sm:max-h-[45%] shrink-0 overflow-y-auto anim-fade-up bg-zinc-950/95 border-t border-zinc-800/40 p-3 sm:p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md dark:bg-zinc-950/95 dark:border-zinc-800/40 light:bg-white/90 light:border-zinc-200/30">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:gap-4">
            <select
              value={activeAnim}
              onChange={(e) => onAnimChange(e.target.value)}
              className="w-full rounded-lg sm:rounded-xl border border-zinc-800/40 bg-zinc-950/80 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider focus:outline-none sm:hidden dark:border-zinc-800/40 dark:bg-zinc-950/80 light:border-zinc-200/40 light:bg-zinc-100 light:text-zinc-950"
            >
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.label}</option>
              ))}
            </select>
            
            {/* Simulation specific controls */}
            <div className="flex flex-col sm:flex-wrap sm:items-center gap-2.5 sm:gap-3 sm:justify-center">
              {activeAnim === 'projectile' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Angle ({params.angle}°)</label>
                    <input type="range" min="10" max="80" step="1" value={params.angle} onChange={(e) => handleParamChange('angle', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-24 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Vel ({params.velocity}m/s)</label>
                    <input type="range" min="5" max="25" step="0.5" value={params.velocity} onChange={(e) => handleParamChange('velocity', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-24 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Bounce ({(params.bounciness).toFixed(2)})</label>
                    <input type="range" min="0" max="0.9" step="0.05" value={params.bounciness} onChange={(e) => handleParamChange('bounciness', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-24 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Height ({params.height}m)</label>
                    <input type="range" min="0" max="5" step="0.5" value={params.height} onChange={(e) => handleParamChange('height', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-24 cursor-pointer" />
                  </div>
                  <button onClick={() => handleParamChange('vectors', !params.vectors)} className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${params.vectors ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400'}`}>Vectors</button>
                </>
              )}

              {activeAnim === 'wave' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Freq ({params.frequency} Hz)</label>
                    <input type="range" min="0.5" max="3.0" step="0.1" value={params.frequency} onChange={(e) => handleParamChange('frequency', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-32 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Amp ({params.amplitude}m)</label>
                    <input type="range" min="0.5" max="2.5" step="0.1" value={params.amplitude} onChange={(e) => handleParamChange('amplitude', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-32 cursor-pointer" />
                  </div>
                  <button onClick={() => handleParamChange('superposition', !params.superposition)} className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${params.superposition ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400'}`}>Superposition</button>
                </>
              )}

              {activeAnim === 'pendulum' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Length ({params.length}m)</label>
                    <input type="range" min="2" max="8" step="0.2" value={params.length} onChange={(e) => handleParamChange('length', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-32 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Angle ({params.angle ?? 30}°)</label>
                    <input type="range" min="10" max="75" step="1" value={params.angle ?? 30} onChange={(e) => handleParamChange('angle', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-32 cursor-pointer" />
                  </div>
                  <button onClick={() => handleParamChange('vectors', !params.vectors)} className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${params.vectors ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400'}`}>Vectors</button>
                </>
              )}

              {activeAnim === 'forces' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Force ({params.applied} N)</label>
                    <input type="range" min="-50" max="50" step="1" value={params.applied} onChange={(e) => handleParamChange('applied', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-32 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-20 text-right">μ ({params.mu.toFixed(2)})</label>
                    <input type="range" min="0" max="0.8" step="0.05" value={params.mu} onChange={(e) => handleParamChange('mu', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-28 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-20 text-right">Mass ({params.mass} kg)</label>
                    <input type="range" min="1" max="20" step="0.5" value={params.mass} onChange={(e) => handleParamChange('mass', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-28 cursor-pointer" />
                  </div>
                  <button onClick={() => handleParamChange('vectors', !params.vectors)} className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${params.vectors ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400'}`}>Vectors</button>
                </>
              )}

              {activeAnim === 'collision' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Mass A ({params.mass1} kg)</label>
                    <input type="range" min="1" max="10" step="0.5" value={params.mass1} onChange={(e) => handleParamChange('mass1', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 flex-1 sm:w-28 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24 text-right">Mass B ({params.mass2} kg)</label>
                    <input type="range" min="1" max="10" step="0.5" value={params.mass2} onChange={(e) => handleParamChange('mass2', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 w-28 cursor-pointer" />
                  </div>
                  <button onClick={() => handleParamChange('elastic', !params.elastic)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${params.elastic ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400'}`}>{params.elastic ? 'Elastic' : 'Inelastic'}</button>
                </>
              )}

              {activeAnim === 'orbit' && (
                <>
                  <div className="flex items-center gap-2.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-28 text-right">Eccentricity ({params.eccentricity})</label>
                    <input type="range" min="0" max="0.85" step="0.05" value={params.eccentricity} onChange={(e) => handleParamChange('eccentricity', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 w-32 cursor-pointer" />
                  </div>
                </>
              )}

              {activeAnim === 'electricity' && (
                <>
                  <div className="flex items-center gap-2.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-28 text-right">Separation ({params.separation} m)</label>
                    <input type="range" min="2" max="10" step="0.5" value={params.separation} onChange={(e) => handleParamChange('separation', parseFloat(e.target.value))} className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 w-32 cursor-pointer" />
                  </div>
                </>
              )}
            </div>

            {/* Global player controls */}
            <div className="flex items-center justify-between border-t pt-4 flex-wrap gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Global Speed ({speed}x)</label>
                <input
                  type="range"
                  min="0.25"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="accent-emerald-500 h-1.5 rounded-full bg-zinc-800 w-28 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer btn-ghost"
                  style={isPaused ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer btn-ghost hover:text-red-400 hover:bg-red-500/10"
                >
                  <RotateCcw className="w-4 h-4" />
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
