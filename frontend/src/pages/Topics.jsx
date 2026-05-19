import React from 'react';
import { BookOpen, HelpCircle, ArrowUpRight } from 'lucide-react';

const Topics = ({ onSelectTopic }) => {
  const topics = [
    { title: "Projectile Motion", desc: "Kinematics equations, gravity acceleration, and flight times.", tag: "Physical Sciences", prompt: "Explain projectile motion for Grade 11 CAPS Physical Sciences." },
    { title: "Gas Laws", desc: "Boyle's, Charles's, and the ideal gas equation relationships.", tag: "Chemistry", prompt: "Explain gas laws and ideal gases." },
    { title: "Reaction Rates", desc: "Collision theory, catalysts, and why reactions speed up.", tag: "Chemistry", prompt: "Explain collision theory and reaction rates." },
    { title: "Newton's Laws", desc: "Force, mass, and acceleration in action.", tag: "Physical Sciences", prompt: "Explain Newton's second law with a simple example." },
    { title: "Waves", desc: "Frequency, wavelength, and speed with CAPS examples.", tag: "Physical Sciences", prompt: "Explain wave motion and the Doppler effect." },
    { title: "Electric Fields", desc: "Charges and the field lines between them.", tag: "Physical Sciences", prompt: "How do electric fields work?" },
    { title: "Bonding", desc: "Ionic and covalent bonding with particle-level explanations.", tag: "Chemistry", prompt: "Explain ionic and covalent bonding." },
    { title: "Acids and Bases", desc: "pH, neutralisation, and acid-base behavior in solution.", tag: "Chemistry", prompt: "Explain acids, bases, and pH." },
    { title: "Electrochemistry", desc: "Redox reactions, cells, and electron flow.", tag: "Chemistry", prompt: "Explain electrochemistry and galvanic cells." }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 select-none">
      
      {/* Top Header */}
      <div>
        <h2 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          Syllabus study planner
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-semibold uppercase tracking-wider">Select a CAPS Physics or Chemistry topic to start a focused revision session.</p>
      </div>

      {/* Grid of topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((topic, idx) => (
          <div
            key={idx}
            onClick={() => onSelectTopic(topic.prompt)}
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/35 hover:border-emerald-500/25 hover:bg-zinc-200/20 dark:hover:bg-zinc-900/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                  {topic.tag}
                </span>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-100 uppercase tracking-wide mt-2">{topic.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {topic.desc}
              </p>
            </div>
            
            <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-500 group-hover:underline">
              <HelpCircle className="w-3.5 h-3.5" />
              Start Revision
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Topics;
