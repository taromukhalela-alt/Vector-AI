// ─────────────────────────────────────────────────────────────────────────────
// MarkdownRenderer.jsx — Emerald Nexus
// Tighter prose, emerald accent links/quotes, refined code blocks, math support.
// ─────────────────────────────────────────────────────────────────────────────
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css';

const normalizeMathDelimiters = (value = '') => {
  const parts = String(value).split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('~~~')) return part;
      return part
        .replace(/\\\[([\s\S]*?)\\\]/g, (_m, math) => `\n\n$$\n${math}\n$$\n\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => `$${math}$`);
    })
    .join('');
};

const MarkdownRenderer = ({ content }) => {
  const normalizedContent = normalizeMathDelimiters(content);

  return (
    <div
      className="
        prose prose-sm prose-zinc dark:prose-invert max-w-none
        text-[14px] leading-[1.7] text-zinc-200 light:text-zinc-800
        prose-p:my-2
        prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-zinc-50 light:prose-headings:text-zinc-900
        prose-h1:text-[20px] prose-h2:text-[17px] prose-h3:text-[15px]
        prose-h1:mt-4 prose-h1:mb-2
        prose-h2:mt-4 prose-h2:mb-2
        prose-h3:mt-3 prose-h3:mb-1.5
        prose-strong:text-zinc-50 light:prose-strong:text-zinc-900 prose-strong:font-semibold
        prose-em:text-emerald-300 light:prose-em:text-emerald-700
        prose-a:text-emerald-400 prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:underline-offset-2
        prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
        prose-li:marker:text-emerald-400/70
        prose-blockquote:my-3 prose-blockquote:border-l-2 prose-blockquote:border-emerald-500/60
        prose-blockquote:bg-emerald-500/[0.04] prose-blockquote:px-3 prose-blockquote:py-1
        prose-blockquote:not-italic prose-blockquote:text-zinc-300 light:prose-blockquote:text-zinc-700
        prose-blockquote:rounded-r-lg
        prose-code:rounded-md prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5
        prose-code:text-emerald-300 light:prose-code:text-emerald-700
        prose-code:text-[0.85em] prose-code:font-medium prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:my-3 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/[0.06]
        prose-pre:bg-zinc-900/80 light:prose-pre:bg-zinc-100 light:prose-pre:border-zinc-200
        prose-pre:p-3 prose-pre:text-[12.5px] prose-pre:leading-relaxed
        prose-hr:border-white/[0.06] light:prose-hr:border-zinc-200
        prose-table:text-[13px]
        prose-th:font-semibold prose-th:text-zinc-50 light:prose-th:text-zinc-900
        prose-th:border-b prose-th:border-white/[0.08] light:prose-th:border-zinc-200
        prose-td:border-b prose-td:border-white/[0.04] light:prose-td:border-zinc-100
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          p: ({ children }) => <p style={{ margin: '10px 0' }}>{children}</p>,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
