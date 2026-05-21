import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { 
  FileText, Search, Plus, Trash2, Edit, Eye, Download, 
  Sparkles, CheckCircle, Save, HelpCircle 
} from 'lucide-react';
import renderMathInElement from 'katex/dist/contrib/auto-render';

const Notes = () => {
  const { csrfToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Edit form states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  // AI note generation state
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Alerts
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success');

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
  }, []);
  
  useEffect(() => {
  fetchNotes();
}, []);

useEffect(() => {
  if (typeof window.html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
  }
}, []);
  const showStatus = (msg, type = 'success') => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditTopic(note.topic || 'General');
    setEditContent(note.content || '');
    setIsEditing(false);
  };

  const handleCreateNote = () => {
    const newNote = {
      id: `temp-${Date.now()}`,
      title: 'New Study Note',
      topic: 'General',
      content: '# New Study Note\n\nStart writing notes in markdown. Math equations work here: $$E=mc^2$$',
      isTemp: true
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
          ai_generated: false
        })
      });

      const data = await res.json();
      if (data.success) {
        showStatus('Note saved successfully!');
        
        // Refresh note listing
        const savedNote = data.note || {
          id: selectedNote.id,
          title: editTitle,
          topic: editTopic,
          content: editContent
        };
        setSelectedNote(savedNote);
        setIsEditing(false);
        fetchNotes();
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
        headers: {
          'X-CSRF-Token': csrfToken,
        }
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
    showStatus('Generating comprehensive study guide... This may take up to 30 seconds.', 'success');

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
        showStatus('Study guide generated successfully!');
        setAiTopic('');
        fetchNotes();
        
        // Find and select the newly generated note
        if (data.note) {
          handleSelectNote(data.note);
        }
      } else {
        showStatus(data.message || 'Generation failed. Try another query.', 'error');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error during AI generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Brand and download PDF
  const handleDownloadPDF = async () => {
    if (!selectedNote) return;
    if (typeof window.html2pdf === 'undefined') {
      alert('PDF exporter is still loading. Please try again in a moment.');
      return;
    }

    showStatus('Compiling high-fidelity PDF with KaTeX math rendering...', 'success');

    // Create offscreen print container
    const pdfContainer = document.createElement('div');
    pdfContainer.style.padding = '35px 30px';
    pdfContainer.style.fontFamily = 'Inter, sans-serif';
    pdfContainer.style.color = '#18181b'; // zinc-900 ink

    // Styled Branded Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.borderBottom = '2.5px solid #10b981'; // vibrant emerald accent
    header.style.paddingBottom = '14px';
    header.style.marginBottom = '28px';

    header.innerHTML = `
      <div>
        <h1 style="margin: 0; font-size: 22px; color: #18181b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${selectedNote.title}</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase;">Topic: ${selectedNote.topic || 'General'}</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 900; color: #10b981; letter-spacing: 1px;">VECTOR AI</div>
        <div style="font-size: 9px; color: #71717a; font-weight: 700; margin-top: 2px; text-transform: uppercase;">CAPS STEM OS</div>
      </div>
    `;
    pdfContainer.appendChild(header);

    // Document Body Content wrapper
    const bodyWrap = document.createElement('div');
    bodyWrap.style.fontSize = '12px';
    bodyWrap.style.lineHeight = '1.6';
    bodyWrap.style.color = '#27272a';

    // Parse markdown into HTML inside bodyWrap
    const { marked } = await import('marked');
    marked.setOptions({ breaks: true, gfm: true });
    bodyWrap.innerHTML = marked.parse(selectedNote.content || '');
    pdfContainer.appendChild(bodyWrap);

    // Subtly Branded Footer
    const footer = document.createElement('div');
    footer.style.borderTop = '1px solid #e4e4e7';
    footer.style.paddingTop = '14px';
    footer.style.marginTop = '45px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.fontSize = '9px';
    footer.style.color = '#71717a';
    footer.style.fontWeight = '600';
    footer.style.textTransform = 'uppercase';

    footer.innerHTML = `
      <span>Built by Taro Mukhalela &middot; Vector AI STEM OS</span>
      <span>Date Exported: ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    `;
    pdfContainer.appendChild(footer);

    // Inject KaTeX styles dynamically to offscreen container
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
    pdfContainer.appendChild(link);

    document.body.appendChild(pdfContainer);

    // Auto-render math in the container
    try {
      renderMathInElement(pdfContainer, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    } catch (e) {
      console.error('KaTeX print render error', e);
    }

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `${selectedNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await window.html2pdf().set(opt).from(pdfContainer).save();
      showStatus('PDF guide downloaded successfully!');
    } catch (err) {
      console.error(err);
      showStatus('Failed to generate PDF document', 'error');
    } finally {
      document.body.removeChild(pdfContainer);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotes(searchQuery);
  };

  return (
    <div className="flex h-[calc(100vh-53px)] md:h-screen overflow-hidden relative">
      
      {/* Alert banner */}
      {statusMessage && (
        <div className={`absolute top-4 right-4 z-50 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg ${
          statusType === 'success' ? 'bg-emerald-500 text-zinc-950' : 'bg-red-500 text-white'
        }`}>
          <CheckCircle className="w-4 h-4" />
          {statusMessage}
        </div>
      )}

      {/* Left Sidebar: Notes & AI generator */}
      <aside className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 flex flex-col hidden md:flex">
        
        {/* Search */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
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

        {/* Notes list */}
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
                {note.ai_generated && (
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                )}
              </button>
            ))
          )}
        </div>

        {/* AI generator overlay controls */}
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

      {/* Center workspace */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950">
        {selectedNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header toolbar */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
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
                    <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-zinc-800 dark:text-zinc-100">{selectedNote.title}</h2>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{selectedNote.topic || 'General'}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </>
                  )}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveNote}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}

                <button
                  onClick={handleDownloadPDF}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>

                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Editor / Preview container */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-600"
                  placeholder="Write your study notes content in markdown..."
                />
              ) : (
                <div className="max-w-4xl mx-auto">
                  <MarkdownRenderer content={selectedNote.content} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <FileText className="w-10 h-10 text-zinc-400 mb-4" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Select a Study Note</h3>
            <p className="text-xs text-zinc-400 mt-1">Review saved summaries, draft practice guides, or prompt the AI helper to generate comprehensive study notes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
