export const SITE_URL = 'https://vector-ai.co.za';
export const SITE_NAME = 'Vector AI';

export const routeMeta = {
  '/': {
    title: 'Vector AI – CAPS Physical Sciences & Chemistry AI Tutor | Grades 10–12 South Africa',
    description:
      'Master CAPS Physical Sciences and Chemistry with Vector AI. AI-powered study notes, voice tutoring, and interactive simulations for South African learners in Grades 10, 11, and 12. Aligned to the CAPS curriculum.',
    keywords: 'CAPS tutor, Physical Sciences, Chemistry tutor, South Africa, Grade 10, Grade 11, Grade 12, AI tutoring, STEM learning, study platform, physics tutor, chemistry tutor, online learning',
  },
  '/auth': {
    title: 'Sign In - Vector AI',
    description:
      'Sign in to Vector AI to access your CAPS AI tutor, notes vault, history, and study tools.',
    robots: 'noindex, nofollow',
  },
  '/chat': {
    title: 'AI Tutor - Physics & Chemistry Questions | Vector AI',
    description:
      'Ask CAPS Physical Sciences and Chemistry questions, work through complex equations, and receive instant AI tutor explanations from Vector AI. Get help with physics problems, chemical equations, and exam preparation.',
    keywords: 'physics tutor, chemistry tutor, physics help, chemistry help, CAPS questions, physics equations, chemistry reactions, exam tutoring, homework help, AI tutor, online physics tutor, online chemistry tutor',
  },
  '/voice': {
    title: 'Voice Tutor - Learn Physics & Chemistry by Speaking | Vector AI',
    description:
      'Speak to the Vector AI voice tutor for real-time CAPS Physical Sciences and Chemistry explanations. Audio-based learning for hands-free study and personalized voice tutoring.',
    keywords: 'voice tutor, audio learning, voice tutoring, CAPS voice, physics voice tutor, chemistry voice tutor, conversational learning, hands-free learning, audio study, speaking practice',
  },
  '/lab': {
    title: 'Interactive Physics Lab - Simulations & Experiments | Vector AI',
    description:
      'Explore interactive physics simulations including projectile motion, waves, forces, gravitational fields, orbital mechanics, and collision dynamics. Hands-on CAPS-aligned physics learning through visual experimentation.',
    keywords: 'physics simulations, interactive experiments, projectile motion, waves, forces, fields, orbits, collisions, physics lab, virtual lab, physics visual learning, interactive physics, hands-on physics',
  },
  '/notes': {
    title: 'Study Notes - Create & Share Physics & Chemistry Notes | Vector AI',
    description:
      'Create, save, search, and export CAPS-aligned Physical Sciences and Chemistry study notes with Vector AI. Build a personalized study guide with organized notes for exam revision and exam preparation.',
    keywords: 'study notes, physics notes, chemistry notes, CAPS notes, revision notes, study guides, note-taking, organized notes, exam notes, study materials, physics study guide, chemistry study guide',
  },
  '/history': {
    title: 'Chat History - Vector AI',
    description:
      'Review previous Vector AI tutoring sessions, calculations, explanations, and saved study conversations.',
    robots: 'noindex, nofollow',
  },
  '/topics': {
    title: 'CAPS Syllabus Topics - Physics & Chemistry Curriculum | Vector AI',
    description:
      'Browse complete CAPS Physical Sciences and Chemistry syllabus topics with organized curriculum content. Start focused Vector AI revision sessions on any specific topic from Grades 10, 11, and 12 curriculum.',
    keywords: 'CAPS topics, CAPS syllabus, physics topics, chemistry topics, curriculum, science syllabus, Grade 10 topics, Grade 11 topics, Grade 12 topics, CAPS physics, CAPS chemistry, subject outline',
  },
  '/dashboard': {
    title: 'Learning Dashboard - Study Progress & Analytics | Vector AI',
    description:
      'Track your physics and chemistry learning progress with Vector AI dashboard. Monitor study streaks, session history, topic mastery, and personalized insights to improve your CAPS exam preparation.',
    keywords: 'learning dashboard, study progress, learning analytics, performance tracking, study statistics, topic mastery, progress tracker, learning insights, study metrics, exam preparation tracker',
  },
};

const DEFAULT_META = routeMeta['/'];

const upsertMeta = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
};

const upsertLink = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
};

export const getRouteMeta = (pathname) => routeMeta[pathname] || DEFAULT_META;

export const applyRouteMeta = (pathname) => {
  const meta = getRouteMeta(pathname);
  const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;
  const image = `${SITE_URL}/icon-512.svg`;

  document.title = meta.title;
  upsertMeta('meta[name="description"]', { name: 'description', content: meta.description });
  if (meta.keywords) {
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: meta.keywords });
  }
  upsertMeta('meta[name="robots"]', { name: 'robots', content: meta.robots || 'index, follow' });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });
};
