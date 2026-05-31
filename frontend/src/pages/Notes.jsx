import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import {
  FileText, Search, Plus, Trash2, Edit, Eye, Download,
  Sparkles, CheckCircle, Save, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// No global side‑effects – pass options directly to marked.parse
const renderSafeMarkdown = (content) => {
  return DOMPurify.sanitize(marked.parse(content || '', { breaks: true, gfm: true }));
};

const Notes = () => {
  const { csrfToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  );
  const [sidebarPinned, setSidebarPinned] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('vector_notes_sidebar_pinned') === 'true'
      : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success');
  const statusTimeoutRef = useRef(null);

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

  const showStatus = (msg, type = 'success') => {
    setStatusMessage(msg);
    setStatusType(type);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setStatusMessage(''), 3000);
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
        showStatus(data.message || 'Failed to save note', 'error');
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
        showStatus(data.message || 'Generation failed', 'error');
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

  // ==================== PDF Export (with null checks) ====================
  const handleDownloadPDF = async () => {
    if (!selectedNote) return;

    setIsExportingPdf(true);
    showStatus('Compiling high‑fidelity PDF…', 'success');

    let iframe = null;

    try {
      // 1. Create off‑screen iframe
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '794px';
      iframe.style.height = '1122px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) throw new Error('Cannot access iframe document');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css" crossorigin="anonymous">
            <style>
              body { margin:0; padding:0; background:#ffffff; font-family:Inter,sans-serif; }
              .vector-pdf-body h1,.vector-pdf-body h2,.vector-pdf-body h3,.vector-pdf-body h4 { break-after:avoid; page-break-after:avoid; }
              .vector-pdf-body p,.vector-pdf-body li { orphans:3; widows:3; }
              .vector-pdf-body { font-size:12px; color:#27272a; line-height:1.65; overflow-wrap:anywhere; word-break:normal; }
              .vector-pdf-body h1,.vector-pdf-body h2,.vector-pdf-body h3,.vector-pdf-body h4 { color:#18181b; font-weight:800; line-height:1.2; margin:18px 0 8px; page-break-after:avoid; }
              .vector-pdf-body h1 { font-size:21px; }
              .vector-pdf-body h2 { font-size:17px; border-bottom:1px solid #d4d4d8; padding-bottom:4px; }
              .vector-pdf-body h3 { font-size:14px; color:#047857; }
              .vector-pdf-body p { margin:0 0 10px; }
              .vector-pdf-body ul,.vector-pdf-body ol { margin:0 0 12px 20px; padding:0; }
              .vector-pdf-body li { margin:3px 0; padding-left:2px; }
              .vector-pdf-body strong { font-weight:800; color:#18181b; }
              .vector-pdf-body a { color:#047857; text-decoration:underline; }
              .vector-pdf-body blockquote { margin:12px 0; padding:8px 12px; border-left:3px solid #10b981; background:#f0fdf4; color:#3f3f46; }
              .vector-pdf-body code { font-family:"Courier New",monospace; font-size:11px; background:#f4f4f5; color:#18181b; border-radius:3px; padding:1px 4px; }
              .vector-pdf-body pre { margin:12px 0; padding:10px 12px; background:#f4f4f5; border:1px solid #e4e4e7; border-radius:6px; white-space:pre-wrap; overflow-wrap:anywhere; page-break-inside:avoid; }
              .vector-pdf-body pre code { padding:0; background:transparent; border-radius:0; }
              .vector-pdf-body table { width:100%; table-layout:fixed; border-collapse:collapse; margin:12px 0; page-break-inside:avoid; }
              .vector-pdf-body th,.vector-pdf-body td { border:1px solid #d4d4d8; padding:6px 8px; text-align:left; vertical-align:top; overflow-wrap:anywhere; }
              .vector-pdf-body th { background:#f4f4f5; color:#18181b; font-weight:800; }
              .vector-pdf-body .katex-display { margin:12px 0; max-width:100%; overflow:hidden; page-break-inside:avoid; }
              .vector-pdf-body .katex-display>.katex { max-width:100%; white-space:normal; font-size:0.92em; }
            </style>
          </head>
          <body>
            <div id="pdf-container" style="width:794px; padding:35px 30px; font-family:Inter,sans-serif; background:#ffffff; color:#18181b; box-sizing:border-box; line-height:1.6;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2.5px solid #10b981; padding-bottom:14px; margin-bottom:28px;">
                <div>
                  <h1 id="hdr-title" style="margin:0; font-size:22px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;"></h1>
                  <p id="hdr-topic" style="margin:4px 0 0; font-size:11px; color:#71717a; font-weight:600; text-transform:uppercase;"></p>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px; font-weight:900; color:#10b981; letter-spacing:1px;">VECTOR AI</div>
                  <div style="font-size:9px; color:#71717a; font-weight:700; margin-top:2px; text-transform:uppercase;">CAPS STEM OS</div>
                </div>
              </div>
              <div id="pdf-body" class="vector-pdf-body"></div>
              <div style="border-top:1px solid #e4e4e7; padding-top:14px; margin-top:45px; display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#71717a; font-weight:600; text-transform:uppercase;">
                <span>Built by Taro Mukhalela – Vector AI STEM OS</span>
                <span id="hdr-date"></span>
              </div>
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Small delay to ensure the iframe’s DOM is fully built
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Fill in data – with null guards
      const hdrTitle = iframeDoc.getElementById('hdr-title');
      if (hdrTitle) hdrTitle.textContent = selectedNote.title || 'Study Note';

      const hdrTopic = iframeDoc.getElementById('hdr-topic');
      if (hdrTopic) hdrTopic.textContent = `Topic: ${selectedNote.topic || 'General'}`;

      const hdrDate = iframeDoc.getElementById('hdr-date');
      if (hdrDate)
        hdrDate.textContent = `Date Exported: ${new Date().toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`;

      const pdfBody = iframeDoc.getElementById('pdf-body');
      if (pdfBody) {
        pdfBody.innerHTML = renderSafeMarkdown(selectedNote.content);
      }

      // 3. Render KaTeX inside the iframe
      try {
        if (pdfBody) {
          renderMathInElement(pdfBody, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true },
            ],
            throwOnError: false,
          });
        }
      } catch (e) {
        console.error('KaTeX render error', e);
      }

      // 4. Capture the iframe body
      const canvas = await html2canvas(iframeDoc.body, {
        scale: window.devicePixelRatio > 1 ? 2 : 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // 5. Build PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const imgWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;

      let position = 0;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, position, imgWidth, imgHeight);
      let heightLeft = imgHeight - pageHeight;

      while (heightLeft > 0) {
        position = -pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = (selectedNote.title || 'study_note')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '') + '.pdf';
      pdf.save(filename);

      trackEvent('note_pdf_exported', {
        route: '/notes',
        note_topic: selectedNote.topic || 'General',
      });
      showStatus('PDF guide downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed', err);
      trackEvent('note_pdf_export_failed', {
        route: '/notes',
        error_message: err instanceof Error ? err.message : String(err),
      });
      showStatus(`Failed to generate PDF: ${err.message}`, 'error');
    } finally {
      if (iframe?.parentNode) document.body.removeChild(iframe);
      setIsExportingPdf(false);
    }
  };

  // ==================== JSX ====================
  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {statusMessage && (
        <div
          className={`absolute top-4 right-4 z-50 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg ${
            statusType === 'success' ? 'bg-emerald-500 text-zinc-950' : 'bg-red-500 text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {statusMessage}
        </div>
      )}

      {sidebarVisible && !isDesktop && (
        <div
          className="fixed inset-0 z-130 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 flex flex-col transition-all duration-300 ${
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
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
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

              <div className="flex shrink-0 items-center gap-2 overflow-x-auto">
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
                  disabled={isExportingPdf}
                  className={`p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                    isExportingPdf
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer'
                  }`}
                >
                  {isExportingPdf ? (
                    <span className="inline-flex h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {isExportingPdf ? 'Exporting...' : 'PDF'}
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
                <div className="mx-auto max-w-3xl">
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