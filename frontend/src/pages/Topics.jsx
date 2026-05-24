import { BookOpen, HelpCircle, ArrowUpRight } from 'lucide-react';
import { trackEvent } from '../useAnalytics';

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
    <div className="h-full min-h-0 overflow-y-auto px-4 py-5 select-none sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h2 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          Syllabus study planner
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-semibold uppercase tracking-wider">Select a CAPS Physics or Chemistry topic to start a focused revision session.</p>
      </div>

      {/* Grid of topics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, idx) => (
          <div
            key={idx}
            onClick={() => {
              trackEvent('topic_revision_started', {
                route: '/topics',
                topic: topic.title,
              });
              onSelectTopic(topic.prompt);
            }}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-zinc-200 bg-white/40 p-4 transition-all hover:border-emerald-500/25 hover:bg-zinc-200/30 dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/55"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                  {topic.tag}
                </span>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="mt-2 text-sm font-extrabold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">{topic.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {topic.desc}
              </p>
            </div>
            
            <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-200/50 pt-3 text-[10px] font-bold uppercase text-emerald-500 group-hover:underline dark:border-zinc-800/50">
              <HelpCircle className="w-3.5 h-3.5" />
              Start Revision
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default Topics;
