import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import {
  FileText, Search, Plus, Trash2, Edit, Eye, Download,
  Sparkles, Save, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';

// No global side‑effects – pass options directly to marked.parse

const renderSafeMarkdown = (content) => {
  return DOMPurify.sanitize(
    marked.parse(content || '', {
      breaks: true,
      gfm: true,
    }),
    {
      ADD_TAGS: ['math', 'semantics', 'annotation'],
      ADD_ATTR: ['xmlns'],
    }
  );
};

const Notes = () => {
  const { csrfToken } = useAuth();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  );
  const [sidebarPinned, setSidebarPinned] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('vector_notes_sidebar_pinned') === 'true'
      : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarVisible = isDesktop ? sidebarPinned || sidebarOpen : sidebarOpen;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false);
    };
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const toggleSidebar = () => {
    if (isDesktop) {
      setSidebarPinned((current) => {
        const next = !current;
        localStorage.setItem('vector_notes_sidebar_pinned', String(next));
        return next;
      });
      setSidebarOpen(false);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditTopic(note.topic || 'General');
    setEditContent(note.content || '');
    setIsEditing(false);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const fetchNotes = async (query = '') => {
    try {
      const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.notes)) {
        setNotes(data.notes);
        if (data.notes.length > 0 && !selectedNote) {
          handleSelectNote(data.notes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showStatus = (message, type = 'success', title) => {
    showToast({
      type,
      title: title || (type === 'error' ? 'Notes issue' : 'Notes'),
      message,
    });
  };

  const handleCreateNote = () => {
    const newNote = {
      id: `temp-${Date.now()}`,
      title: 'New Study Note',
      topic: 'General',
      content:
        '# New Study Note\n\nStart writing notes in markdown. Math equations work here: $$E=mc^2$$',
      isTemp: true,
    };
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditTopic(newNote.topic);
    setEditContent(newNote.content);
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      showStatus('Title and content are required', 'error');
      return;
    }

    try {
      const isNew = !selectedNote || selectedNote.isTemp;
      const url = isNew ? '/api/notes' : `/api/notes/${selectedNote.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          title: editTitle,
          topic: editTopic,
          content: editContent,
          ai_generated: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        trackEvent('note_saved', {
          route: '/notes',
          note_topic: editTopic || 'General',
          is_new: isNew,
        });
        showStatus('Note saved successfully!');
        await fetchNotes(); // get real IDs from the server
        const savedNote = data.note || notes.find((n) => n.title === editTitle);
        if (savedNote) {
          setSelectedNote(savedNote);
          setEditTitle(savedNote.title);
          setEditTopic(savedNote.topic || 'General');
          setEditContent(savedNote.content || '');
        }
        setIsEditing(false);
      } else {
        console.warn('Note save failed:', data.message);
        showStatus('Your note could not be saved. Please try again.', 'error', 'Save failed');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error while saving', 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    if (String(id).startsWith('temp-')) {
      setSelectedNote(null);
      return;
    }
    if (!confirm('Are you sure you want to delete this study note?')) return;

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (data.success) {
        showStatus('Note deleted successfully');
        setSelectedNote(null);
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAINote = async () => {
    if (!aiTopic.trim()) {
      showStatus('Please specify a CAPS topic to generate notes', 'error');
      return;
    }

    setIsGenerating(true);
    showStatus('Generating comprehensive study guide…', 'success');

    try {
      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ topic: aiTopic }),
      });
      const data = await res.json();

      if (data.success) {
        trackEvent('ai_note_generated', {
          route: '/notes',
          topic_length: aiTopic.length,
        });
        showStatus('Study guide generated successfully!');
        setAiTopic('');
        fetchNotes();
        if (data.note) handleSelectNote(data.note);
      } else {
        console.warn('AI note generation failed:', data.message);
        showStatus('The study guide could not be generated. Please try again.', 'error', 'Generation failed');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error during AI generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotes(searchQuery);
  };

  // ==================== PDF Export (html2pdf.js) ====================
  const handleDownloadPDF = useCallback(async () => {
    if (!selectedNote) return;
    setIsExporting(true);

    // ── 1. Build the note body HTML from markdown ──────────────────
    const bodyHtml = renderSafeMarkdown(selectedNote.content || '');

    // ── 2. Copy KaTeX CSS link from live <head> so math renders ───
    const katexLinkHref = (() => {
      const found = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .find((l) => l.href && l.href.includes('katex'));
      return found ? found.href : '';
    })();

    // ── 3. Generate cover date string ──────────────────────────────
    const dateStr = new Date().toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // ── 4. Build off-screen container ─────────────────────────────
    const wrapper = document.createElement('div');
    wrapper.id = 'vai-pdf-offscreen';
    wrapper.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'width:794px',      // A4 @ 96 dpi
      'background:#ffffff',
      'font-family:Inter,system-ui,sans-serif',
      'color:#0a0a0a',
      'font-size:13pt',
      'line-height:1.75',
      'z-index:-9999',
    ].join(';');

    // ── 5. Inline KaTeX stylesheet so math survives html2canvas ───
    const katexStyle = katexLinkHref
      ? `<link rel="stylesheet" href="${katexLinkHref}" />`
      : '';

    wrapper.innerHTML = `
      ${katexStyle}
      <style>
        /* ── Reset ── */
        #vai-pdf-offscreen * { box-sizing: border-box; margin: 0; padding: 0; border-color: #e5e7eb; outline-color: #e5e7eb; }

        /* ── Cover ── */
        #vai-pdf-offscreen .vai-cover {
          background: linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%);
          padding: 36px 40px 28px;
          border-radius: 0;
          margin-bottom: 0;
        }
        #vai-pdf-offscreen .vai-cover-wordmark {
          font-size: 11pt;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.75);
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        #vai-pdf-offscreen .vai-cover-title {
          font-size: 26pt;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        #vai-pdf-offscreen .vai-cover-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        #vai-pdf-offscreen .vai-cover-badge {
          background: rgba(255,255,255,0.22);
          border: 1px solid rgba(255,255,255,0.35);
          color: #ffffff;
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 999px;
        }
        #vai-pdf-offscreen .vai-cover-date {
          font-size: 9pt;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
        }
        #vai-pdf-offscreen .vai-cover-author {
          font-size: 9pt;
          color: rgba(255,255,255,0.6);
          font-style: italic;
        }

        /* ── Divider ── */
        #vai-pdf-offscreen .vai-divider {
          height: 3px;
          background: linear-gradient(90deg, #10b981 0%, #34d399 50%, transparent 100%);
          margin-bottom: 32px;
        }

        /* ── Body ── */
        #vai-pdf-offscreen .vai-body {
          padding: 0 40px 40px;
        }

        /* ── Typography ── */
        #vai-pdf-offscreen .vai-body h1 {
          font-size: 22pt;
          font-weight: 800;
          color: #0a0a0a;
          border-bottom: 3px solid #10b981;
          padding-bottom: 8px;
          margin: 8px 0 18px;
          break-after: avoid;
          letter-spacing: -0.01em;
        }
        #vai-pdf-offscreen .vai-body h2 {
          font-size: 16pt;
          font-weight: 700;
          color: #0a0a0a;
          padding-left: 10px;
          border-left: 4px solid #10b981;
          margin: 28px 0 12px;
          break-after: avoid;
        }
        #vai-pdf-offscreen .vai-body h3 {
          font-size: 13pt;
          font-weight: 700;
          color: #059669;
          margin: 22px 0 8px;
          break-after: avoid;
        }
        #vai-pdf-offscreen .vai-body h4 {
          font-size: 11pt;
          font-weight: 700;
          color: #065f46;
          margin: 16px 0 6px;
          break-after: avoid;
        }
        #vai-pdf-offscreen .vai-body p {
          margin: 10px 0;
          color: #1a1a2e;
          font-size: 11.5pt;
          line-height: 1.75;
        }
        #vai-pdf-offscreen .vai-body strong { color: #0a0a0a; font-weight: 700; }
        #vai-pdf-offscreen .vai-body em { color: #374151; }

        /* ── Lists ── */
        #vai-pdf-offscreen .vai-body ul, #vai-pdf-offscreen .vai-body ol {
          margin: 8px 0 12px 0;
          padding-left: 22px;
        }
        #vai-pdf-offscreen .vai-body li {
          margin-bottom: 5px;
          font-size: 11.5pt;
          line-height: 1.7;
          color: #1a1a2e;
        }
        #vai-pdf-offscreen .vai-body li::marker { color: #10b981; font-weight: 700; }

        /* ── Blockquote ── */
        #vai-pdf-offscreen .vai-body blockquote {
          border-left: 4px solid #10b981;
          background: #f0fdf4;
          padding: 14px 18px;
          margin: 16px 0;
          color: #374151;
          font-style: italic;
          border-radius: 0 6px 6px 0;
          break-inside: avoid;
        }

        /* ── Tables ── */
        #vai-pdf-offscreen .vai-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 18px 0;
          font-size: 10.5pt;
          break-inside: avoid;
        }
        #vai-pdf-offscreen .vai-body thead tr {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        #vai-pdf-offscreen .vai-body th {
          color: #ffffff;
          font-weight: 700;
          padding: 10px 14px;
          text-align: left;
          font-size: 9.5pt;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid #059669;
        }
        #vai-pdf-offscreen .vai-body td {
          border: 1px solid #d1fae5;
          padding: 9px 14px;
          color: #1a1a2e;
          vertical-align: top;
        }
        #vai-pdf-offscreen .vai-body tbody tr:nth-child(even) td {
          background: #f0fdf4;
        }
        #vai-pdf-offscreen .vai-body tbody tr:nth-child(odd) td {
          background: #ffffff;
        }

        /* ── Code ── */
        #vai-pdf-offscreen .vai-body pre {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #10b981;
          border-radius: 6px;
          padding: 16px 18px;
          margin: 16px 0;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 9.5pt;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
          break-inside: avoid;
          color: #1e293b;
        }
        #vai-pdf-offscreen .vai-body code {
          background: #ecfdf5;
          color: #065f46;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.88em;
          font-weight: 500;
        }
        #vai-pdf-offscreen .vai-body pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-weight: 400;
        }

        /* ── KaTeX math ── */
        #vai-pdf-offscreen .katex-display {
          margin: 20px 0 !important;
          overflow-x: auto;
        }
        #vai-pdf-offscreen .katex-display > .katex {
          display: block;
          text-align: center;
        }
        #vai-pdf-offscreen .katex { font-size: 1.1em; }

        /* ── Horizontal rule ── */
        #vai-pdf-offscreen .vai-body hr {
          border: none;
          border-top: 1.5px solid #d1fae5;
          margin: 24px 0;
        }

        /* ── Images ── */
        #vai-pdf-offscreen .vai-body img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 12px 0;
        }

        /* ── Footer ── */
        #vai-pdf-offscreen .vai-footer {
          margin: 36px 40px 0;
          padding-top: 10px;
          border-top: 1.5px solid #d1fae5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8pt;
          color: #6b7280;
          break-inside: avoid;
        }
        #vai-pdf-offscreen .vai-footer-brand {
          font-weight: 700;
          color: #10b981;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        #vai-pdf-offscreen .vai-footer-right {
          text-align: right;
        }
      </style>

      <!-- Cover -->
      <div class="vai-cover">
        <div class="vai-cover-wordmark">⬡ Vector AI · STEM OS</div>
        <div class="vai-cover-title">${selectedNote.title || 'Study Note'}</div>
        <div class="vai-cover-meta">
          <span class="vai-cover-badge">${selectedNote.topic || 'General'}</span>
          <span class="vai-cover-date">${dateStr}</span>
          <span class="vai-cover-author">by Taro</span>
        </div>
      </div>

      <!-- Emerald gradient divider -->
      <div class="vai-divider"></div>

      <!-- Note body -->
      <div class="vai-body">${bodyHtml}</div>

      <!-- Footer -->
      <div class="vai-footer">
        <span class="vai-footer-brand">Vector AI</span>
        <span class="vai-footer-right">Generated by Vector AI · Taro · ${dateStr}</span>
      </div>
    `;

    document.body.appendChild(wrapper);

    // ── 6. html2pdf options ────────────────────────────────────────
    const safeFilename = (selectedNote.title || 'study_note')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    const options = {
      margin: [10, 0, 10, 0],
      filename: `${safeFilename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Strip oklch() and other unsupported CSS color functions
          // html2canvas (bundled in html2pdf) crashes on oklch — replace with safe values
          const OKLCH_RE = /oklch\([^)]*\)/gi;
          const CSS_COLOR_FN_RE = /\b(?:oklch|oklab|lab|lch|color)\s*\([^)]*\)/gi;

          clonedDoc.querySelectorAll('*').forEach((el) => {
            // Force light colour-scheme
            el.style.setProperty('color-scheme', 'light', 'important');

            // Pull computed styles and overwrite any that contain oklch
            try {
              const cloneWin = clonedDoc.defaultView || window;
              const computed = cloneWin.getComputedStyle(el);
              const propsToCheck = [
                'color', 'background-color', 'border-color',
                'border-top-color', 'border-right-color',
                'border-bottom-color', 'border-left-color',
                'outline-color', 'text-decoration-color',
                'fill', 'stroke', 'caret-color',
                'box-shadow', 'text-shadow',
              ];

              propsToCheck.forEach((prop) => {
                const val = computed.getPropertyValue(prop);
                if (val && (OKLCH_RE.test(val) || CSS_COLOR_FN_RE.test(val))) {
                  // Map common semantic roles to safe fallbacks
                  const isBackground = prop.includes('background');
                  const isBorder = prop.includes('border') || prop.includes('outline');
                  const fallback = isBackground ? '#ffffff'
                    : isBorder ? '#e5e7eb'
                    : '#0a0a0a';
                  el.style.setProperty(prop, fallback, 'important');
                }
              });

              // Also scrub inline style attribute for any oklch refs
              if (el.getAttribute('style')) {
                el.setAttribute(
                  'style',
                  el.getAttribute('style')
                    .replace(OKLCH_RE, '#0a0a0a')
                    .replace(CSS_COLOR_FN_RE, '#0a0a0a')
                );
              }
            } catch (_) { /* cross-origin or SVG nodes — skip */ }
          });

          // Ensure KaTeX SVGs are visible
          clonedDoc.querySelectorAll('.katex svg').forEach((svg) => {
            svg.style.setProperty('display', 'inline-block', 'important');
          });

          // Nuke any <style> blocks in the cloned doc that reference oklch
          clonedDoc.querySelectorAll('style').forEach((styleEl) => {
            if (styleEl.textContent.includes('oklch')) {
              styleEl.textContent = styleEl.textContent
                .replace(/:\s*oklch\([^)]*\)/g, ': #0a0a0a')
                .replace(/oklch\([^)]*\)/g, '#0a0a0a');
            }
          });
        },
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.vai-page-break',
      },
    };

    try {
      await html2pdf().set(options).from(wrapper).save();
      showStatus('PDF exported — beautifully crafted! ✓');
      trackEvent('pdf_exported', {
        route: '/notes',
        note_title: selectedNote.title,
        topic: selectedNote.topic || 'General',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      showStatus('Failed to generate PDF. Please try again.', 'error');
    } finally {
      // ── 7. Tear down off-screen node ────────────────────────────
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      setIsExporting(false);
    }
  }, [selectedNote, showStatus]);

  // ==================== JSX ====================
  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {sidebarVisible && !isDesktop && (
        <div
          className="no-print fixed inset-0 z-130 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`no-print shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 flex flex-col transition-all duration-300 ${
          sidebarVisible
            ? 'fixed inset-y-0 left-0 z-140 w-72 shadow-2xl md:static md:z-auto md:w-64 md:shadow-none'
            : 'hidden'
        }`}
      >
        {/* ... exactly the same sidebar content as your original ... */}
        <div className="space-y-3 border-b border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Study Notes</span>
            <button
              onClick={() => {
                setSidebarPinned(false);
                localStorage.setItem('vector_notes_sidebar_pinned', 'false');
                setSidebarOpen(false);
              }}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
              title="Close notes panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search study guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-200/50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/50 rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vault Notes</span>
            <button
              onClick={handleCreateNote}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-emerald-500 cursor-pointer"
              title="Create Study Note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-6">No study guides</p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold truncate flex items-center justify-between cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
                {note.ai_generated && <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 space-y-2">
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">AI Guide Generator</div>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Newton's Laws"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="w-full bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/50 rounded-lg py-1.5 px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
            />
          </div>
          <button
            onClick={handleGenerateAINote}
            disabled={isGenerating}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold rounded-lg py-2 text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3 h-3 fill-current animate-pulse" />
            Generate
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 min-w-0">
        {selectedNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={toggleSidebar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition hover:bg-zinc-200/70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  title={sidebarVisible ? 'Hide notes' : 'Show notes'}
                >
                  {sidebarVisible ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  Notes
                </button>
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note Title"
                      className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs sm:text-sm font-bold focus:outline-none text-zinc-800 dark:text-zinc-100"
                    />
                    <input
                      type="text"
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      placeholder="Topic (e.g. Physics)"
                      className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none w-28 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="truncate font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-100 sm:text-base">
                      {selectedNote.title}
                    </h2>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      {selectedNote.topic || 'General'}
                    </span>
                  </div>
                )}
              </div>

              <div className="no-print flex shrink-0 items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </>
                  ) : (
                    <>
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </>
                  )}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveNote}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                )}

                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors text-zinc-900 dark:text-zinc-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExporting ? 'Exporting...' : 'PDF'}
                </button>

                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-600"
                  placeholder="Write your study notes content in markdown..."
                />
              ) : (
                <div id="print-note-root" className="mx-auto max-w-3xl prose max-w-none p-6">
                  <MarkdownRenderer content={selectedNote.content} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4">
            <button
              onClick={toggleSidebar}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition hover:bg-zinc-200/70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {sidebarVisible ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Notes
            </button>
            <FileText className="w-10 h-10 text-zinc-400 mb-4" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Select a Study Note</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Review saved summaries, draft practice guides, or prompt the AI helper to generate comprehensive study
              notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
