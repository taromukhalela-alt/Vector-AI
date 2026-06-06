import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css';

const normalizeMathDelimiters = (value = '') => {
  const parts = String(value).split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);

  return parts
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('~~~')) {
        return part;
      }

      return part
        .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => `\n\n$$\n${math}\n$$\n\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => `$${math}$`);
    })
    .join('');
};

const MarkdownRenderer = ({ content }) => {
  const normalizedContent = normalizeMathDelimiters(content);

  return (
    <div
      className="
        prose prose-zinc dark:prose-invert
        max-w-none text-sm leading-relaxed
        prose-p:my-1.5
        prose-headings:my-2
        prose-ul:my-1.5
        prose-ol:my-1.5
        prose-li:my-0.5
        prose-pre:bg-zinc-100
        dark:prose-pre:bg-zinc-900
        prose-pre:border
        prose-pre:border-zinc-200
        dark:prose-pre:border-zinc-800
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          // Force proper paragraph spacing for print
          p: ({ children }) => <p style={{ margin: '12px 0' }}>{children}</p>
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
