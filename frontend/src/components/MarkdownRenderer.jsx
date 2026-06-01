import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css';

const MarkdownRenderer = ({ content }) => {
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
        rehypePlugins={[rehypeKatex]}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;