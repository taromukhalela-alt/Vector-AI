import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render';

const MarkdownRenderer = ({ content }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Parse markdown
      try {
        marked.setOptions({ breaks: true, gfm: true });
        const html = marked.parse(content || '');
        containerRef.current.innerHTML = html;
      } catch (err) {
        containerRef.current.textContent = content || '';
      }

      // Render math
      try {
        renderMathInElement(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX auto-render error:', err);
      }
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed
                 prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5
                 prose-li:my-0.5 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 
                 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 
                 prose-code:text-accent dark:prose-code:text-accent font-sans" 
    />
  );
};

export default MarkdownRenderer;
