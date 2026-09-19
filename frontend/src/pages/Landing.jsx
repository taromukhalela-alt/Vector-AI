import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import DotGrid from "../components/DotGrid";
import VectorIcon from "../components/VectorIcon";
import {
  ArrowRightIcon,
  BookOpenIcon,
  FlaskIcon,
  GraduationCapIcon,
  ChatCircleIcon,
  ArrowCounterClockwiseIcon,
  SigmaIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";

// ─── Vector AI landing — editorial, flat, unapologetic ───────────────────────
const Landing = () => {
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth";

  const features = [
    {
      no: "01",
      icon: ChatCircleIcon,
      title: "AI Tutor",
      tone: "bg-[var(--emerald)]",
      body: "Ask anything from the CAPS syllabus. Vector explains with equations, worked steps and follow-up questions — not walls of text.",
      points: [
        "Step-by-step derivations",
        "Follow-up learning actions",
        "Session memory across topics",
      ],
    },
    {
      no: "02",
      icon: FlaskIcon,
      title: "Physics Lab",
      tone: "bg-[var(--lab-steel)] text-white",
      body: "A real laboratory workspace. Adjust velocity, angle and mass, run the simulation, and read the measurements like an instrument panel.",
      points: [
        "Projectile motion & more",
        "Live parameter control",
        "Measurement readouts",
      ],
    },
    {
      no: "03",
      icon: BookOpenIcon,
      title: "Study Notes",
      tone: "bg-[var(--magenta)] text-white",
      body: "Generate full CAPS study guides in seconds. Chapter headings, definitions, worked examples and common mistakes — exportable to PDF.",
      points: [
        "AI study guides",
        "Digital textbook reader",
        "One-click PDF export",
      ],
    },
    {
      no: "04",
      icon: ArrowCounterClockwiseIcon,
      title: "Adaptive Revision",
      tone: "bg-[var(--ink)] text-[var(--paper)]",
      body: "Vector finds your weak areas and drills them. Write your working, get marked against the rubric, and see exactly what to fix next.",
      points: [
        "Weak-area targeting",
        "Rubric-based marking",
        "Focus areas per session",
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b-[3px] border-[var(--border)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Vector AI home"
          >
            <span className="flex h-9 w-9 items-center justify-center border-2 border-[var(--border)] bg-[var(--emerald)] shadow-[2px_2px_0_var(--border)]">
              <VectorIcon
                className="h-5 w-5"
                color="#0B1410"
                accent="var(--ink)"
              />
            </span>
            <span className="font-display text-lg font-bold uppercase tracking-tight">
              Vector<span className="text-[var(--magenta)]">AI</span>
            </span>
            <span className="neo-tag hidden sm:inline-flex">
              STEM learning system
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/lab"
              className="hidden text-xs font-black uppercase tracking-widest text-[var(--ink)] hover:text-[var(--magenta)] md:inline"
            >
              Physics Lab
            </Link>
            <Link
              to={primaryHref}
              className="neo-btn neo-btn-primary px-4 py-2 text-xs"
            >
              {isAuthenticated ? "Open app" : "Sign in"}{" "}
              <ArrowRightIcon
                className="ml-1.5 h-3.5 w-3.5"
                weight="bold"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — dot grid + parallax */}
      <section className="relative overflow-hidden border-b-[3px] border-[var(--border)]">
        <DotGrid />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <p className="section-label mb-6">
              <span className="neo-tag neo-tag-magenta mr-3">
                CAPS · GR 10–12
              </span>
              Physical Sciences · Mathematics · Life Sciences
            </p>
            <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
              Learn
              <br />
              louder.
              <br />
              <span className="bg-[var(--emerald)] px-2 text-[#0B1410]">
                Remember
              </span>
              <br />
              longer.
            </h1>
            <p className="mt-8 max-w-xl border-l-[6px] border-[var(--magenta)] bg-[var(--surface)] p-4 text-[17px] font-medium leading-relaxed shadow-[4px_4px_0_var(--border)]">
              Vector AI is an AI-powered STEM learning system for South Africa —
              a personal CAPS tutor, a physics laboratory, a textbook generator
              and an adaptive drill coach in one place.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryHref}
                className="neo-btn neo-btn-primary px-8 py-4 text-base"
              >
                {isAuthenticated ? "Continue learning" : "Start learning free"}{" "}
                <ArrowRightIcon
                  className="ml-2 h-5 w-5"
                  weight="bold"
                  aria-hidden="true"
                />
              </Link>
              <Link
                to="/lab"
                className="neo-btn neo-btn-magenta px-8 py-4 text-base"
              >
                <FlaskIcon
                  className="mr-2 h-5 w-5"
                  weight="bold"
                  aria-hidden="true"
                />
                Try the Physics Lab
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              AI-powered STEM learning · CAPS-aligned · Free to start
            </p>
          </motion.div>

          {/* Spec panel */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className="self-center border-[3px] border-[var(--border)] bg-[var(--surface)] shadow-[8px_8px_0_var(--border)]"
          >
            <div className="flex items-center justify-between border-b-[3px] border-[var(--border)] bg-[var(--magenta)] px-5 py-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                System index
              </p>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                v2.0
              </p>
            </div>
            {[
              ["LEARN", "Dashboard · Subjects · Topics"],
              ["PRACTICE", "Revision · Mock Exams"],
              ["CREATE", "Study Notes"],
              ["EXPLORE", "Physics Lab"],
              ["VECTOR", "AI Tutor · History"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--border)] px-5 py-4 last:border-b-0"
              >
                <span className="font-mono text-sm font-bold tracking-widest text-[var(--magenta)]">
                  {k}
                </span>
                <span className="text-right text-[13px] font-bold text-[var(--ink-muted)]">
                  {v}
                </span>
              </div>
            ))}
            <div className="border-t-[3px] border-[var(--border)] bg-[var(--emerald)] px-5 py-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B1410]">
                Status: all systems teaching
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b-[3px] border-[var(--border)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x-2 divide-[var(--paper)]/20 lg:grid-cols-4">
          {[
            ["CAPS", "Aligned curriculum"],
            ["24/7", "Tutor availability"],
            ["1-Click", "PDF study guides"],
            ["100%", "Free to start"],
          ].map(([big, small]) => (
            <div key={big} className="px-5 py-8 text-center sm:px-8">
              <p className="font-display text-3xl font-bold uppercase tracking-tight text-[var(--emerald)] sm:text-4xl">
                {big}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--paper)]/60">
                {small}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Magenta marquee band */}
      <div
        className="overflow-hidden border-b-[3px] border-[var(--border)] bg-[var(--magenta)] py-2"
        aria-hidden="true"
      >
        <p className="whitespace-nowrap text-center text-[12px] font-black uppercase tracking-[0.3em] text-white">
          Physics · Chemistry · Mathematics · CAPS Grades 10–12 · Physics ·
          Chemistry · Mathematics · CAPS Grades 10–12
        </p>
      </div>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="flex items-end justify-between border-b-[3px] border-[var(--border)] pb-6">
          <h2 className="font-display text-4xl font-bold uppercase tracking-tight md:text-5xl">
            What Vector does
          </h2>
          <p className="section-label hidden md:block">
            Four tools. One system.
          </p>
        </div>
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            initial: {},
            animate: { transition: { staggerChildren: 0.08 } },
          }}
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {features.map(({ no, icon: Icon, title, body, points, tone }) => (
            <motion.article
              key={no}
              variants={{
                initial: { opacity: 0, y: 16 },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3, ease: "easeOut" },
                },
              }}
              className="flex flex-col border-[3px] border-[var(--border)] bg-[var(--surface)] p-7 shadow-[6px_6px_0_var(--border)]"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center border-2 border-[var(--border)] ${tone}`}
                >
                  <Icon className="h-6 w-6" weight="bold" aria-hidden="true" />
                </span>
                <span className="font-mono text-3xl font-bold text-[var(--ink-muted)] opacity-40">
                  {no}
                </span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-[15px] font-medium leading-relaxed text-[var(--ink-muted)]">
                {body}
              </p>
              <ul className="mt-5 space-y-2 border-t-2 border-[var(--border)] pt-4">
                {points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 text-[13px] font-bold"
                  >
                    <SigmaIcon
                      className="h-3.5 w-3.5 shrink-0 text-[var(--magenta)]"
                      weight="bold"
                      aria-hidden="true"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* CTA band */}
      <section className="border-y-[3px] border-[var(--border)] bg-[var(--emerald)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:py-16">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B1410]">
              No credit card. No catch.
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-[#0B1410] md:text-5xl">
              Your next test
              <br />
              starts here.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              className="neo-btn neo-btn-ink px-8 py-4 text-base"
            >
              <GraduationCapIcon
                className="mr-2 h-5 w-5"
                weight="bold"
                aria-hidden="true"
              />
              {isAuthenticated ? "Go to dashboard" : "Create free account"}
            </Link>
            <Link
              to="/notes"
              className="neo-btn neo-btn-surface px-8 py-4 text-base"
            >
              <DownloadSimpleIcon
                className="mr-2 h-5 w-5"
                weight="bold"
                aria-hidden="true"
              />
              See study notes
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center border-2 border-[var(--border)] bg-[var(--emerald)]">
            <VectorIcon
              className="h-4 w-4"
              color="#0B1410"
              accent="var(--ink)"
            />
          </span>
          <div>
            <span className="block text-sm font-black uppercase">
              Vector AI
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              STEM learning system
            </span>
          </div>
        </div>
        <nav
          className="flex flex-wrap gap-5 text-[11px] font-black uppercase tracking-widest"
          aria-label="Footer"
        >
          <Link to="/chat" className="hover:text-[var(--magenta)]">
            AI Tutor
          </Link>
          <Link to="/lab" className="hover:text-[var(--magenta)]">
            Physics Lab
          </Link>
          <Link to="/notes" className="hover:text-[var(--magenta)]">
            Notes
          </Link>
          <Link to="/revision" className="hover:text-[var(--magenta)]">
            Revision
          </Link>
          <Link to={primaryHref} className="hover:text-[var(--magenta)]">
            Sign in
          </Link>
        </nav>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
          AI-accelerated learning · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default Landing;
