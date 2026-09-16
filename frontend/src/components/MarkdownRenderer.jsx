import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Normalize LaTeX delimiters so remark-math always sees $…$ / $$…$$.
 * We must leave code fences untouched to avoid mangling code blocks.
 */
const normalizeMathDelimiters = (value = '') => {
  // Split out fenced code blocks first
  const parts = String(value).split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('~~~')) return part;
      return part
        // \[…\]  →  $$\n…\n$$
        .replace(/\\\[([\s\S]*?)\\\]/g, (_m, math) => `\n\n$$\n${math.trim()}\n$$\n\n`)
        // \(…\)  →  $…$
        .replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => `$${math.trim()}$`);
    })
    .join('');
};

const MarkdownRenderer = ({ content }) => {
  const normalizedContent = normalizeMathDelimiters(content);

  return (
    <div
      className={`
        prose prose-sm max-w-none
        text-[var(--ink)] text-[14px] leading-[1.7]
        prose-p:my-2.5 prose-p:leading-relaxed
        prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
        prose-headings:text-[var(--ink)]
        prose-h1:text-[22px] prose-h2:text-[18px] prose-h3:text-[16px] prose-h4:text-[14px]
        prose-h1:mt-6 prose-h1:mb-3
        prose-h2:mt-5 prose-h2:mb-2.5
        prose-h3:mt-4 prose-h3:mb-2
        prose-strong:font-extrabold prose-strong:text-[var(--ink)]
        prose-a:text-[var(--emerald-dark)] prose-a:font-bold prose-a:underline prose-a:underline-offset-2
        prose-ul:my-2.5 prose-ol:my-2.5 prose-li:my-1
        prose-blockquote:my-4
        prose-blockquote:border-l-4 prose-blockquote:border-[var(--emerald)]
        prose-blockquote:bg-[var(--surface-muted)] prose-blockquote:px-4 prose-blockquote:py-2
        prose-blockquote:not-italic
        prose-blockquote:text-[var(--ink)]
        prose-code:bg-[var(--surface-muted)]
        prose-code:px-1.5 prose-code:py-0.5
        prose-code:text-[var(--emerald-dark)]
        prose-code:text-[0.85em] prose-code:font-bold
        prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:my-3 prose-pre:rounded-none prose-pre:border-2
        prose-pre:border-[var(--border)]
        prose-pre:bg-[var(--surface-muted)]
        prose-pre:p-3.5 prose-pre:text-[12.5px] prose-pre:leading-relaxed
        prose-hr:border-[var(--border)] prose-hr:my-6
        prose-table:text-[13px]
        prose-th:font-extrabold prose-th:bg-[var(--surface-muted)]
        prose-th:text-[var(--ink)]
        prose-th:border-2 prose-th:border-[var(--border)] prose-th:px-3 prose-th:py-1.5
        prose-td:border-2 prose-td:border-[var(--border)] prose-td:px-3 prose-td:py-1.5
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, output: 'htmlAndMathml' }]]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          // Ensure tables have a wrapper for horizontal scroll on mobile
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto border-2 border-[var(--border)]">
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
