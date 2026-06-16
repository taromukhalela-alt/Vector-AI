import { Gauge, BookOpen, TrendingUp, Activity, Loader2, Zap, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
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

  const metrics = data?.metrics || [];
  const syllabusProgress = data?.syllabus || [];

  return (
    <div className="bg-zinc-950 min-h-full">
      <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8 select-none">
        {/* Header */}
        <div className="anim-fade-up">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400 text-[10.5px] font-medium tracking-wider uppercase mb-3">
            <LayoutDashboard className="w-3 h-3" strokeWidth={2.25} />
            Command Center
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-zinc-50">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Learner'}!
          </h1>
          <p className="text-[14px] text-zinc-400 mt-1.5 max-w-2xl">
            Here is your live STEM performance telemetry and CAPS syllabus progress. Keep pushing towards mastery.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => {
            const radius = 48;
            const strokeWidth = 8;
            const circumference = 2 * Math.PI * radius;
            const percent = (metric.value / metric.max) * 100;
            const strokeDashoffset = circumference - (percent / 100) * circumference;
            const delay = (idx + 1) * 100;

            return (
              <div 
                key={idx} 
                className="anim-fade-up relative p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.05] hover:border-emerald-500/20 transition-all group overflow-hidden shadow-lg"
                style={{ animationDelay: `${delay}ms` }}
              >
                <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-emerald-400/70 transition-colors">{metric.label}</span>
                  <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <Gauge className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2} />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative w-[110px] h-[110px] flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="55" cy="55" r={radius} className="stroke-white/[0.04]" strokeWidth={strokeWidth} fill="transparent" />
                      <circle
                        cx="55" cy="55" r={radius}
                        className="stroke-emerald-500 transition-all duration-1000 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.4))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[24px] font-bold tracking-tighter text-zinc-50 tabular-nums">{metric.value}</span>
                      <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">{metric.unit}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">
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
