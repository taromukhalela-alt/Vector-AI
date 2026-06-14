
import { Gauge, BookOpen, TrendingUp, Activity } from "lucide-react";

const Dashboard = () => {
  const metrics = [
    { label: "Model accuracy", value: 98.7, max: 100, unit: "%", desc: "Trajectory model accuracy across visual labs" },
    { label: "Inference latency", value: 14.2, max: 50, unit: "ms", desc: "Median semantic response synthesis time" },
    { label: "CAPS alignment", value: 100, max: 100, unit: "%", desc: "Syllabus criteria compliance match" }
  ];

  const syllabusProgress = [
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
        <div className="anim-fade-up d-100">
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
            const delayClass = `d-${(idx + 2) * 100}`;

            return (
              <div key={idx} className={`anim-fade-up ${delayClass} relative p-6 rounded-xl bg-zinc-900/40 border border-white/[0.05] hover:border-white/[0.08] transition-colors group`}>
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
        <div className="anim-fade-up d-500 rounded-xl bg-zinc-900/40 border border-white/[0.05] overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/[0.05] flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-400" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-100 tracking-tight">Syllabus progress</h2>
                <p className="text-[12px] text-zinc-500 mt-0.5">CAPS Physical Sciences module milestones</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-300 text-[10.5px] font-medium">
              <TrendingUp className="w-3 h-3 text-emerald-400" strokeWidth={2.25} />
              Grade 12 target
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.04]">
            {syllabusProgress.map((item, idx) => (
              <div key={idx} className="p-5 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] font-semibold text-zinc-100 tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                      {item.title}
                    </h3>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded">{item.grade}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.category === 'Chemistry' ? 'text-teal-300/90 bg-teal-500/[0.06] border-teal-500/15' : 'text-emerald-300/90 bg-emerald-500/[0.06] border-emerald-500/15'}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[14px] font-semibold text-zinc-100 tabular-nums shrink-0">{item.progress}<span className="text-zinc-500 text-[11px] font-normal">%</span></span>
                </div>

                <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.progress}%`, boxShadow: '0 0 8px rgba(16,185,129,0.4)' }}
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
