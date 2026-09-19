import { Books, ArrowRight, Atom, Flask } from '@phosphor-icons/react';
import { trackEvent } from '../useAnalytics';
import { PageHeader } from '../components/ui';

const TOPIC_GROUPS = [
  { group: 'Mechanics', items: [
    { title: 'Kinematics', desc: 'Displacement, velocity, acceleration and motion graphs.', tag: 'Physics', prompt: 'Explain kinematics for Grade 10 CAPS Physical Sciences with worked examples.' },
    { title: 'Projectile Motion', desc: 'Launch angles, range, height and flight time.', tag: 'Physics', prompt: 'Explain projectile motion for Grade 11 CAPS Physical Sciences.' },
    { title: "Newton's Laws", desc: 'Inertia, F=ma, action-reaction and free-body diagrams.', tag: 'Physics', prompt: "Explain Newton's laws with a simple CAPS example." },
    { title: 'Momentum', desc: 'Impulse, conservation and collisions.', tag: 'Physics', prompt: 'Explain momentum and impulse for CAPS Physical Sciences.' },
    { title: 'Energy', desc: 'Work, kinetic and potential energy, power.', tag: 'Physics', prompt: 'Explain work, energy and power for CAPS.' } ]},
  { group: 'Waves, Fields and Matter', items: [
    { title: 'Waves', desc: 'Frequency, wavelength, speed and Doppler effect.', tag: 'Physics', prompt: 'Explain wave motion and the Doppler effect.' },
    { title: 'Electricity', desc: 'Current, voltage, resistance and circuits.', tag: 'Physics', prompt: 'Explain electric circuits and Ohms law for CAPS.' },
    { title: 'Electric Fields', desc: 'Charge, field lines and Coulomb forces.', tag: 'Physics', prompt: 'How do electric fields work?' },
    { title: 'Magnetism and Optics', desc: 'Fields, induction, reflection and refraction.', tag: 'Physics', prompt: 'Explain magnetism and optics basics for CAPS.' } ]},
  { group: 'Chemistry', items: [
    { title: 'Gas Laws', desc: 'Boyle, Charles and the ideal gas equation.', tag: 'Chemistry', prompt: 'Explain gas laws and ideal gases.' },
    { title: 'Reaction Rates', desc: 'Collision theory, catalysts and rate factors.', tag: 'Chemistry', prompt: 'Explain collision theory and reaction rates.' },
    { title: 'Bonding', desc: 'Ionic, covalent and metallic bonding.', tag: 'Chemistry', prompt: 'Explain ionic and covalent bonding.' },
    { title: 'Acids and Bases', desc: 'pH, neutralisation and titrations.', tag: 'Chemistry', prompt: 'Explain acids, bases and pH.' },
    { title: 'Electrochemistry', desc: 'Redox, cells and electron flow.', tag: 'Chemistry', prompt: 'Explain electrochemistry and galvanic cells.' } ]},
];

const Topics = ({ onSelectTopic }) => (
  <div className="flex flex-col gap-8">
    <PageHeader kicker="Syllabus · CAPS" title="Topics" intro="Pick a topic to start a focused tutoring session. Every prompt opens the AI Tutor with CAPS worked examples." />
    {TOPIC_GROUPS.map((section) => (
      <section key={section.group} aria-label={section.group}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border-2 border-[var(--border)] bg-[var(--surface)]"><Books className="h-5 w-5 text-[var(--emerald)]" aria-hidden="true" /></span>
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--ink)]">{section.group}</h2>
          <hr className="rule-heavy flex-1" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((topic) => {
            const Icon = topic.tag === 'Chemistry' ? Flask : Atom;
            return (
              <button key={topic.title} onClick={() => { trackEvent('topic_revision_started', { route: '/topics', topic: topic.title }); onSelectTopic(topic.prompt); }}
                className="neo-card group flex min-h-[190px] flex-col p-5 text-left hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--border)]">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-muted)]"><Icon className="h-5 w-5 text-[var(--ink)]" aria-hidden="true" /></span>
                  <span className="neo-tag">{topic.tag}</span>
                </div>
                <h3 className="mt-4 text-lg font-black uppercase leading-tight text-[var(--ink)]">{topic.title}</h3>
                <p className="mt-2 text-[14px] font-medium leading-relaxed text-[var(--ink-muted)]">{topic.desc}</p>
                <span className="mt-auto flex items-center justify-between border-t-2 border-[var(--border)] pt-3 text-xs font-black uppercase tracking-widest text-[var(--ink)]">
                  Start session <ArrowRight className="h-4 w-4 text-[var(--emerald)]" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    ))}
  </div>
);

export default Topics;
