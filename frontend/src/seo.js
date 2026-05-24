export const SITE_URL = 'https://vector-ai.co.za';
export const SITE_NAME = 'Vector AI';

export const routeMeta = {
  '/': {
    title: 'Vector AI - CAPS Physical Science AI Tutor',
    description:
      'Vector AI is a CAPS-aligned STEM learning platform for South African Physical Sciences, Chemistry, study notes, voice tutoring, and simulations.',
  },
  '/auth': {
    title: 'Sign In - Vector AI',
    description:
      'Sign in to Vector AI to access your CAPS AI tutor, notes vault, history, and study tools.',
    robots: 'noindex, nofollow',
  },
  '/chat': {
    title: 'AI Tutor - Vector AI',
    description:
      'Ask CAPS Physical Sciences and Chemistry questions, work through equations, and get AI tutor explanations from Vector AI.',
  },
  '/voice': {
    title: 'Voice Tutor - Vector AI',
    description:
      'Speak to the Vector AI voice tutor for real-time CAPS Physical Sciences and Chemistry explanations.',
  },
  '/lab': {
    title: 'Visual Physics Lab - Vector AI',
    description:
      'Explore projectile motion, waves, forces, fields, orbits, and collisions in Vector AI interactive physics simulations.',
  },
  '/notes': {
    title: 'Study Notes - Vector AI',
    description:
      'Create, save, search, and export CAPS-aligned Physical Sciences and Chemistry study notes with Vector AI.',
  },
  '/history': {
    title: 'Chat History - Vector AI',
    description:
      'Review previous Vector AI tutoring sessions, calculations, explanations, and saved study conversations.',
    robots: 'noindex, nofollow',
  },
  '/topics': {
    title: 'CAPS Syllabus Topics - Vector AI',
    description:
      'Browse CAPS Physical Sciences and Chemistry topics and start focused Vector AI revision sessions.',
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
