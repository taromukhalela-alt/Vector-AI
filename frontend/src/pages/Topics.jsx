import { BookOpen, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="h-full min-h-0 overflow-y-auto px-4 py-6 select-none sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
      
      {/* Top Header */}
      <div className="anim-fade-up d-100 flex flex-col gap-1 border-b border-white/[0.06] pb-6">
        <h2 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
          Syllabus Planner
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-bold uppercase tracking-wider">Select a CAPS Physics or Chemistry topic to start a focused revision session.</p>
      </div>

      {/* Grid of topics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, idx) => {
          const delayClass = `d-${(idx % 9 + 2) * 50}`;
          return (
            <div
              key={idx}
              onClick={() => {
                trackEvent('topic_revision_started', {
                  route: '/topics',
                  topic: topic.title,
                });
                onSelectTopic(topic.prompt);
              }}
              className={`anim-fade-up ${delayClass} card p-5 flex cursor-pointer flex-col justify-between transition-all group hover:-translate-y-1 hover:shadow-glow hover:border-emerald-500/30`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="tag">
                    {topic.tag === 'Chemistry' ? <Sparkles className="w-3 h-3 text-teal-400" /> : null}
                    {topic.tag}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-extrabold uppercase tracking-wide text-zinc-100 group-hover:text-emerald-400 transition-colors">{topic.title}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {topic.desc}
                </p>
              </div>
              
              <div className="mt-5 flex items-center gap-1.5 border-t border-white/[0.06] pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-emerald-500 transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
                Start Revision
                <ArrowRight className="w-3 h-3 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default Topics;
