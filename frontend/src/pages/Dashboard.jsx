import { Gauge, BookOpen, TrendingUp, Activity, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Retrieving Telemetry...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || [
    { label: "Model accuracy", value: 98.7, max: 100, unit: "%", desc: "Trajectory model accuracy across visual labs" },
    { label: "Inference latency", value: 14.2, max: 50, unit: "ms", desc: "Median semantic response synthesis time" },
    { label: "CAPS alignment", value: 100, max: 100, unit: "%", desc: "Syllabus criteria compliance match" }
  ];

  const syllabusProgress = data?.syllabus || [
    { title: "Newton's Laws & Forces", progress: 85, grade: "Gr 11/12", category: "Physics" },
    { title: "Projectile Motion", progress: 92, grade: "Gr 12", category: "Physics" },
    { title: "Reaction Rates & Energy", progress: 60, grade: "Gr 12", category: "Chemistry" },
    { title: "Acids & Bases", progress: 45, grade: "Gr 11/12", category: "Chemistry" },
    { title: "Electrochemistry", progress: 78, grade: "Gr 12", category: "Chemistry" },
    { title: "Doppler Effect & Waves", progress: 100, grade: "Gr 11/12", category: "Physics" }
  ];

  return (
    <div className="bg-zinc-950 min-h-full">
      <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8 select-none">
        {/* Header */}
        <div className="anim-fade-up">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400 text-[10.5px] font-medium tracking-wider uppercase mb-3">
            <Activity className="w-3 h-3" strokeWidth={2.25} />
            Live telemetry
          </div>
          <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-zinc-50">
            Engine performance
          </h1>
          <p className="text-[14px] text-zinc-400 mt-1.5">
            Real-time signals from the Vector AI inference engine.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => {
            const radius = 50;
            const strokeWidth = 7;
            const circumference = 2 * Math.PI * radius;
            const percent = (metric.value / metric.max) * 100;
            const strokeDashoffset = circumference - (percent / 100) * circumference;
            const delay = (idx + 1) * 100;

            return (
              <div 
                key={idx} 
                className="anim-fade-up relative p-6 rounded-xl bg-zinc-900/40 border border-white/[0.05] hover:border-emerald-500/20 transition-all group overflow-hidden"
                style={{ animationDelay: `${delay}ms` }}
              >
                <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11.5px] text-zinc-400 font-medium">{metric.label}</span>
                  <Gauge className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.75} />
                </div>

                <div className="flex items-center gap-5">
                  <div className="relative w-[108px] h-[108px] flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="54" cy="54" r={radius} className="stroke-white/[0.05]" strokeWidth={strokeWidth} fill="transparent" />
                      <circle
                        cx="54" cy="54" r={radius}
                        className="stroke-emerald-400 transition-all duration-1000 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.35))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-baseline justify-center gap-0.5">
                      <span className="text-[26px] font-semibold tracking-tight text-zinc-50 tabular-nums self-center">{metric.value}</span>
                      <span className="text-[11px] text-emerald-400 font-medium self-center mt-0.5">{metric.unit}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    {metric.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Syllabus progress */}
        <div className="anim-fade-up rounded-2xl bg-zinc-900/40 border border-white/[0.05] overflow-hidden shadow-2xl" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/[0.05] flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-400" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-zinc-100 tracking-tight">Syllabus progress</h2>
                <p className="text-[12px] text-zinc-500 mt-0.5 font-medium">CAPS Physical Sciences module milestones</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-300 text-[10.5px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
              Grade 12 target
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.04]">
            {syllabusProgress.map((item, idx) => (
              <div key={idx} className="p-6 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-zinc-100 tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                      {item.title}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] font-bold text-zinc-500 px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded uppercase tracking-wider">{item.grade}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider text-emerald-300/90 bg-emerald-500/[0.06] border-emerald-500/15`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-zinc-100 tabular-nums shrink-0">{item.progress}<span className="text-zinc-500 text-[11px] font-medium">%</span></span>
                </div>

                <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden relative z-10">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
