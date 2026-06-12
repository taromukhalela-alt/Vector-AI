import {
  Gauge, BookOpen,
} from 'lucide-react';

const Dashboard = () => {
  // Mock performance data based on STEM OS telemetry
  const metrics = [
    { label: "Accuracy", value: 98.7, max: 100, unit: "%", desc: "Physics Visual Lab trajectory model accuracy" },
    { label: "AI Latency", value: 14.2, max: 50, unit: "ms", desc: "Semantic response synthesis time" },
    { label: "CAPS Alignment", value: 100, max: 100, unit: "%", desc: "Syllabus criteria compliance match" }
  ];

  const syllabusProgress = [
    { title: "Newton's Laws & Forces", progress: 85, grade: "Grade 11/12", category: "Physics" },
    { title: "Projectile Motion", progress: 92, grade: "Grade 12", category: "Physics" },
    { title: "Reaction Rates & Energy", progress: 60, grade: "Grade 12", category: "Chemistry" },
    { title: "Acids & Bases", progress: 45, grade: "Grade 11/12", category: "Chemistry" },
    { title: "Electrochemistry", progress: 78, grade: "Grade 12", category: "Chemistry" },
    { title: "Doppler Effect & Waves", progress: 100, grade: "Grade 11/12", category: "Physics" }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8 select-none">
      
      {/* Top Header */}
      <div className="anim-fade-up d-100 mb-6">
        <h2 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-zinc-100 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
          Neural Telemetry
        </h2>
        <p className="text-xs text-zinc-400 mt-1.5 font-bold uppercase tracking-wider">Vector AI Real-time Engine Metrics</p>
      </div>

      {/* Telemetry Gauge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {metrics.map((metric, idx) => {
          const radius = 50;
          const strokeWidth = 8;
          const circumference = 2 * Math.PI * radius;
          const percent = (metric.value / metric.max) * 100;
          const strokeDashoffset = circumference - (percent / 100) * circumference;
          const delayClass = `d-${(idx + 2) * 100}`;

          return (
            <div key={idx} className={`anim-fade-up ${delayClass} card p-6 flex flex-col items-center text-center group`}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 group-hover:text-zinc-400 transition-colors">{metric.label}</span>
              
              {/* Circular Gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                {/* Glow behind ring */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                <svg className="w-full h-full transform -rotate-90 relative z-10">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-zinc-800"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-emerald-500 transition-all duration-1000 ease-out"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.4))'
                    }}
                  />
                </svg>
                <div className="absolute text-center z-20">
                  <span className="text-2xl font-black tracking-tight text-zinc-100">{metric.value}</span>
                  <span className="text-[10px] font-bold text-emerald-400 ml-0.5">{metric.unit}</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-2 max-w-[200px]">
                {metric.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* CAPS Syllabus Progress Checklist */}
      <div className="anim-fade-up d-500 card p-5 sm:p-7 mt-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
               <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-zinc-100">
                Syllabus Progress
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">CAPS physical sciences module milestones</p>
            </div>
          </div>
          <span className="tag">
            Grade 12 Target
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {syllabusProgress.map((item, idx) => (
            <div key={idx} className="card-flat p-4 transition-all hover:bg-zinc-800/80 hover:border-emerald-500/30 group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-zinc-200 uppercase tracking-wide leading-tight group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-1.5 py-0.5 bg-zinc-800 rounded">{item.grade}</span>
                    <span className="text-[9px] font-bold text-teal-500 uppercase tracking-wider px-1.5 py-0.5 bg-teal-500/10 rounded">{item.category}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 tabular-nums">{item.progress}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
