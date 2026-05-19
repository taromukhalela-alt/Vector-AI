import React from 'react';
import { 
  Gauge, TrendingUp, Cpu, Award, ShieldCheck, 
  Activity, BookOpen, Clock, AlertCircle 
} from 'lucide-react';

const Dashboard = () => {
  // Mock performance data based on STEM OS telemetry
  const metrics = [
    { label: "Accuracy", value: 98.7, max: 100, unit: "%", color: "from-emerald-500 to-teal-500", desc: "Physics Visual Lab trajectory model accuracy" },
    { label: "AI Latency", value: 14.2, max: 50, unit: "ms", color: "from-cyan-500 to-emerald-500", desc: "Semantic response synthesis time" },
    { label: "CAPS Alignment", value: 100, max: 100, unit: "%", color: "from-emerald-500 to-emerald-600", desc: "Syllabus criteria compliance match" }
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
    <div className="p-6 max-w-5xl mx-auto space-y-8 select-none">
      
      {/* Top Header */}
      <div>
        <h2 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-emerald-500" />
          Neural telemetry dashboard
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-semibold uppercase tracking-wider">Vector AI Real-time Engine Metrics</p>
      </div>

      {/* Telemetry Gauge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, idx) => {
          const radius = 50;
          const strokeWidth = 8;
          const circumference = 2 * Math.PI * radius;
          const percent = (metric.value / metric.max) * 100;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <div key={idx} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/35 backdrop-blur-md flex flex-col items-center text-center">
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">{metric.label}</span>
              
              {/* Circular Gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-zinc-200 dark:stroke-zinc-800"
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
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black tracking-tight">{metric.value}</span>
                  <span className="text-xs font-semibold text-zinc-500 ml-0.5">{metric.unit}</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed mt-4 max-w-[200px]">
                {metric.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* CAPS Syllabus Progress Checklist */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/35 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Syllabus Coverage Progress
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">CAPS physical sciences module milestones</p>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
            Grade 12 Matric Target
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {syllabusProgress.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800 bg-zinc-200/20 dark:bg-zinc-900/50 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wide leading-tight">{item.title}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{item.grade}</span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{item.category}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">{item.progress}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-zinc-300 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
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
