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
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-950">
      {/* Simulation Selector Sidebar */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 sm:flex">
        <div className="border-b border-zinc-800 p-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Visual Labs</h2>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = activeAnim === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => onAnimChange(lab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {lab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Viewport Container */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950">
        
        {/* HUD Display (floating top-left) */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-1.5rem)] rounded-lg border border-zinc-900 bg-zinc-950/80 p-3 backdrop-blur-md sm:left-4 sm:top-4 sm:max-w-md sm:p-4">
          <div className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest leading-none mb-1">Interactive HUD</div>
          <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-zinc-100 leading-tight">{hudTitle}</h3>
          <p className="mt-1 max-w-full truncate font-mono text-[11px] leading-normal text-zinc-400 sm:whitespace-normal">{hudFormula}</p>
        </div>

        {/* Readout stats box (floating top-right) */}
        {Object.keys(readout).length > 0 && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none p-4 rounded-lg bg-zinc-950/80 border border-zinc-900 backdrop-blur-md min-w-[140px] hidden sm:block">
            <div className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Telemetry</div>
            <div className="space-y-1.5 font-mono text-[10px] font-bold">
              {Object.entries(readout).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="text-zinc-500 uppercase">{key}</span>
                  <span className="text-emerald-400">{val}</span>
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

        {/* Controls Overlay Panel (bottom) */}
        <div className="relative z-10 max-h-[42%] shrink-0 overflow-y-auto border-t border-zinc-900 bg-zinc-950/95 p-3 backdrop-blur-md sm:p-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            <select
              value={activeAnim}
              onChange={(e) => onAnimChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 focus:outline-none sm:hidden"
            >
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.label}</option>
              ))}
            </select>
            {/* Simulation specific controls */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {activeAnim === 'projectile' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Angle ({params.angle}°)</label>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="1"
                      value={params.angle}
                      onChange={(e) => handleParamChange('angle', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-24 sm:w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Velocity ({params.velocity} m/s)</label>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      step="0.5"
                      value={params.velocity}
                      onChange={(e) => handleParamChange('velocity', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-24 sm:w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bounciness ({params.bounciness})</label>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={params.bounciness}
                      onChange={(e) => handleParamChange('bounciness', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Height ({params.height}m)</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={params.height}
                      onChange={(e) => handleParamChange('height', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-24"
                    />
                  </div>
                  <button
                    onClick={() => handleParamChange('vectors', !params.vectors)}
                    className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      params.vectors ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Vectors
                  </button>
                </>
              )}

              {activeAnim === 'wave' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Frequency ({params.frequency} Hz)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={params.frequency}
                      onChange={(e) => handleParamChange('frequency', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Amplitude ({params.amplitude}m)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={params.amplitude}
                      onChange={(e) => handleParamChange('amplitude', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                  <button
                    onClick={() => handleParamChange('superposition', !params.superposition)}
                    className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      params.superposition ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Superposition
                  </button>
                </>
              )}

              {activeAnim === 'pendulum' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Length ({params.length}m)</label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      step="0.2"
                      value={params.length}
                      onChange={(e) => handleParamChange('length', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">Initial Angle ({params.angle ?? 30}°)</label>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      step="1"
                      value={params.angle ?? 30}
                      onChange={(e) => handleParamChange('angle', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                  <button
                    onClick={() => handleParamChange('vectors', !params.vectors)}
                    className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      params.vectors ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Vectors
                  </button>
                </>
              )}

              {activeAnim === 'forces' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Applied Force ({params.applied} N)</label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={params.applied}
                      onChange={(e) => handleParamChange('applied', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Friction μ ({params.mu})</label>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={params.mu}
                      onChange={(e) => handleParamChange('mu', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mass ({params.mass} kg)</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={params.mass}
                      onChange={(e) => handleParamChange('mass', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-28"
                    />
                  </div>
                  <button
                    onClick={() => handleParamChange('vectors', !params.vectors)}
                    className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      params.vectors ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Vectors
                  </button>
                </>
              )}

              {activeAnim === 'collision' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mass A ({params.mass1} kg)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={params.mass1}
                      onChange={(e) => handleParamChange('mass1', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mass B ({params.mass2} kg)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={params.mass2}
                      onChange={(e) => handleParamChange('mass2', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-28"
                    />
                  </div>
                  <button
                    onClick={() => handleParamChange('elastic', !params.elastic)}
                    className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      params.elastic ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {params.elastic ? 'Elastic' : 'Inelastic'}
                  </button>
                </>
              )}

              {activeAnim === 'orbit' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Eccentricity ({params.eccentricity})</label>
                    <input
                      type="range"
                      min="0"
                      max="0.85"
                      step="0.05"
                      value={params.eccentricity}
                      onChange={(e) => handleParamChange('eccentricity', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                </>
              )}

              {activeAnim === 'electricity' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Separation ({params.separation} m)</label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="0.5"
                      value={params.separation}
                      onChange={(e) => handleParamChange('separation', parseFloat(e.target.value))}
                      className="accent-emerald-500 h-1 rounded bg-zinc-800 w-32"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Global player controls */}
            <div className="flex items-center justify-between border-t border-zinc-900 pt-3 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Global Speed ({speed}x)</label>
                <input
                  type="range"
                  min="0.25"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="accent-emerald-500 h-1 rounded bg-zinc-800 w-28"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
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
