import { BookOpen, ArrowRight, Atom, FlaskConical } from 'lucide-react';
import { trackEvent } from '../useAnalytics';

const Topics = ({ onSelectTopic }) => {
  const topics = [
    { title: "Projectile Motion", desc: "Kinematics equations, gravity acceleration, and flight times.", tag: "Physics", prompt: "Explain projectile motion for Grade 11 CAPS Physical Sciences." },
    { title: "Gas Laws", desc: "Boyle's, Charles's, and the ideal gas equation relationships.", tag: "Chemistry", prompt: "Explain gas laws and ideal gases." },
    { title: "Reaction Rates", desc: "Collision theory, catalysts, and why reactions speed up.", tag: "Chemistry", prompt: "Explain collision theory and reaction rates." },
    { title: "Newton's Laws", desc: "Force, mass, and acceleration in action.", tag: "Physics", prompt: "Explain Newton's second law with a simple example." },
    { title: "Waves", desc: "Frequency, wavelength, and speed with CAPS examples.", tag: "Physics", prompt: "Explain wave motion and the Doppler effect." },
    { title: "Electric Fields", desc: "Charges and the field lines between them.", tag: "Physics", prompt: "How do electric fields work?" },
    { title: "Bonding", desc: "Ionic and covalent bonding with particle-level explanations.", tag: "Chemistry", prompt: "Explain ionic and covalent bonding." },
    { title: "Acids and Bases", desc: "pH, neutralisation, and acid-base behavior in solution.", tag: "Chemistry", prompt: "Explain acids, bases, and pH." },
    { title: "Electrochemistry", desc: "Redox reactions, cells, and electron flow.", tag: "Chemistry", prompt: "Explain electrochemistry and galvanic cells." }
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto px-4 py-8 select-none sm:px-8 bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="anim-fade-up d-100 mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400 text-[10.5px] font-medium tracking-wider uppercase mb-4">
            <BookOpen className="w-3 h-3" strokeWidth={2.25} />
            Syllabus
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-zinc-50 leading-tight">
            Pick a topic to revise
          </h1>
          <p className="text-[14px] text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            CAPS-aligned Physics and Chemistry topics. Click any card to start a focused tutoring session with worked examples.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, idx) => {
            const isChem = topic.tag === 'Chemistry';
            const Icon = isChem ? FlaskConical : Atom;
            const delayClass = `d-${(idx % 9 + 2) * 50}`;
            return (
              <button
                key={idx}
                onClick={() => {
                  trackEvent('topic_revision_started', { route: '/topics', topic: topic.title });
                  onSelectTopic(topic.prompt);
                }}
                className={`anim-fade-up ${delayClass} group relative text-left p-5 rounded-xl bg-zinc-900/40 border border-white/[0.05] hover:border-emerald-500/30 hover:bg-zinc-900/60 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isChem ? 'bg-teal-500/10 text-teal-400 border border-teal-500/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isChem ? 'text-teal-300/90 bg-teal-500/[0.06] border border-teal-500/15' : 'text-emerald-300/90 bg-emerald-500/[0.06] border border-emerald-500/15'}`}>
                    {topic.tag}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-zinc-100 tracking-tight group-hover:text-emerald-300 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-[13px] text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                  {topic.desc}
                </p>

                <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between text-[11.5px] text-zinc-500 group-hover:text-emerald-400 transition-colors">
                  <span className="font-medium">Start session</span>
                  <ArrowRight className="w-3.5 h-3.5 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" strokeWidth={2.25} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Topics;
