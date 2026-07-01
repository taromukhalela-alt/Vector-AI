// ─────────────────────────────────────────────────────────────────────────────
// MarkdownRenderer.jsx — Vector AI
// Tighter prose, emerald accent links/quotes, refined code blocks, full math.
// Works in both light (Notes page) and dark (Chat page) contexts.
// ─────────────────────────────────────────────────────────────────────────────
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css';

/**
 * Normalize LaTeX delimiters so remark-math always sees $…$ / $$…$$.
 * We must leave code fences untouched to avoid mangling code blocks.
 */
export const normalizeMathDelimiters = (value = '') => {
  // Split out fenced code blocks first
  const parts = String(value).split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('~~~')) return part;
      return part
        .replace(/\\begin\{(equation\*?|align\*?|gather\*?)\}([\s\S]*?)\\end\{\1\}/g, (_m, _env, math) => `\n\n$$\n${math.trim()}\n$$\n\n`)
        .replace(/\\{1,2}\[([\s\S]*?)\\{1,2}\]/g, (_m, math) => `\n\n$$\n${math.trim()}\n$$\n\n`)
        .replace(/\\{1,2}\(([\s\S]*?)\\{1,2}\)/g, (_m, math) => `$${math.trim()}$`)
        .replace(/\\\$([^\n$]+?)\\\$/g, (_m, math) => `$${math.trim()}$`)
        .replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_m, math) => `\n\n$$\n${math.trim()}\n$$\n\n`)
        // \[…\]  →  $$\n…\n$$
        .replace(/\\\[([\s\S]*?)\\\]/g, (_m, math) => `\n\n$$\n${math.trim()}\n$$\n\n`)
        // \(…\)  →  $…$
        .replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => `$${math.trim()}$`);
    })
    .join('');
};

const MarkdownRenderer = ({ content, dark = false }) => {
  const normalizedContent = normalizeMathDelimiters(content);

  // Base prose variant – switches between dark (chat) and auto (notes)
  const themeClass = dark
    ? 'prose-invert text-zinc-200'
    : 'dark:prose-invert text-zinc-800 dark:text-zinc-200';

  return (
    <div
      className={`
        prose prose-sm max-w-none
        ${themeClass}
        text-[14px] leading-[1.75]
        prose-p:my-2.5 prose-p:leading-relaxed
        prose-headings:font-bold prose-headings:tracking-tight
        prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50
        prose-h1:text-[22px] prose-h2:text-[18px] prose-h3:text-[16px] prose-h4:text-[14px]
        prose-h1:mt-6 prose-h1:mb-3
        prose-h2:mt-5 prose-h2:mb-2.5 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-zinc-200 dark:prose-h2:border-zinc-800
        prose-h3:mt-4 prose-h3:mb-2
        prose-strong:font-semibold prose-strong:text-zinc-900 dark:prose-strong:text-zinc-50
        prose-em:text-emerald-700 dark:prose-em:text-emerald-300
        prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline prose-a:font-medium
        hover:prose-a:underline hover:prose-a:underline-offset-2
        prose-ul:my-2.5 prose-ol:my-2.5 prose-li:my-1
        prose-li:marker:text-emerald-500/70
        prose-blockquote:my-4
        prose-blockquote:border-l-[3px] prose-blockquote:border-emerald-500/60
        prose-blockquote:bg-emerald-500/[0.04] prose-blockquote:px-4 prose-blockquote:py-2
        prose-blockquote:not-italic prose-blockquote:rounded-r-xl
        prose-blockquote:text-zinc-700 dark:prose-blockquote:text-zinc-300
        prose-code:rounded-md
        prose-code:bg-emerald-500/10 dark:prose-code:bg-emerald-500/10
        prose-code:px-1.5 prose-code:py-0.5
        prose-code:text-emerald-700 dark:prose-code:text-emerald-300
        prose-code:text-[0.85em] prose-code:font-medium
        prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:my-3 prose-pre:rounded-xl prose-pre:border
        prose-pre:border-zinc-200 dark:prose-pre:border-white/[0.06]
        prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900/80
        prose-pre:p-3.5 prose-pre:text-[12.5px] prose-pre:leading-relaxed
        prose-hr:border-zinc-200 dark:prose-hr:border-white/[0.06] prose-hr:my-6
        prose-table:text-[13px]
        prose-th:font-semibold prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800/60
        prose-th:text-zinc-700 dark:prose-th:text-zinc-100
        prose-th:border prose-th:border-zinc-200 dark:prose-th:border-zinc-700 prose-th:px-3 prose-th:py-1.5
        prose-td:border prose-td:border-zinc-200 dark:prose-td:border-zinc-800 prose-td:px-3 prose-td:py-1.5
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, output: 'htmlAndMathml' }]]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          // Ensure tables have a wrapper for horizontal scroll on mobile
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
