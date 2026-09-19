import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatCircle, Clock, ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { PageHeader, EmptyState, ErrorState, VectorLoader } from '../components/ui';

const HistoryPage = ({ onResumeSession }) => {
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('session');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true));
  const [sidebarPinned, setSidebarPinned] = useState(() => (
    typeof window !== 'undefined' ? localStorage.getItem('vector_history_sidebar_pinned') === 'true' : false
  ));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarVisible = isDesktop ? (sidebarPinned || sidebarOpen) : sidebarOpen;

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
        localStorage.setItem('vector_history_sidebar_pinned', String(next));
        return next;
      });
      setSidebarOpen(false);
      return;
    }

    setSidebarOpen(prev => !prev);
  };

  const fetchSessions = async () => {
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.sessions)) {
        throw new Error(data.error || data.message || 'Unable to load session history');
      }
      setSessions(data.sessions);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setHistoryError(error.message || 'Unable to load session history');
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
  }, []);

  const handleSelectSession = useCallback(async (sess) => {
    try {
      const res = await fetch(`/api/session/${sess.chat_id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSession({
          ...sess,
          messages: data.history || []
        });
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setSidebarOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!requestedSessionId || !sessions.length || selectedSession?.chat_id === requestedSessionId) return;
    const requestedSession = sessions.find((sess) => sess.chat_id === requestedSessionId);
    if (requestedSession) {
      // Selecting a deep-linked session is a response to the loaded session list.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSelectSession(requestedSession);
    }
  }, [handleSelectSession, requestedSessionId, selectedSession, sessions]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader kicker="Vector · Archive" title="History" intro="Review past tutor sessions and resume where you left off." />
      <div className="neo-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="section-label">Sessions · {sessions.length}</p>
          <button onClick={toggleSidebar} className="neo-btn px-4 py-2 text-xs">{sidebarVisible ? 'Hide list' : 'Show list'} {sidebarVisible ? <CaretLeft className="ml-2 h-4 w-4" aria-hidden="true" /> : <CaretRight className="ml-2 h-4 w-4" aria-hidden="true" />}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
          {sidebarVisible && (
            <aside className="border-b-[3px] border-[var(--border)] bg-[var(--surface)] md:border-b-0 md:border-r-[3px]" aria-label="Sessions">
              <div className="max-h-96 overflow-y-auto p-3 md:max-h-[560px]">
                {loadingHistory ? (<VectorLoader label="Loading sessions" />) : historyError ? (<ErrorState title="Unable to load history" body={historyError} onRetry={fetchSessions} />) : sessions.length === 0 ? (
                  <EmptyState icon={History} title="No conversations yet" body="Ask Vector something and it will appear here." />
                ) : (
                  <div className="flex flex-col gap-2">
                    {sessions.map((sess) => (
                      <button key={sess.chat_id} onClick={() => handleSelectSession(sess)} className={`border-2 border-[var(--border)] p-3 text-left shadow-[2px_2px_0_var(--border)] ${selectedSession?.chat_id === sess.chat_id ? 'bg-[var(--emerald)] text-white' : 'bg-[var(--paper)] hover:bg-[var(--surface-muted)]'}`}>
                        <span className="flex items-center gap-2 text-sm font-extrabold"><ChatCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{sess.title || 'Untitled Session'}</span></span>
                        <span className={`mt-2 block text-[11px] font-bold uppercase tracking-widest ${selectedSession?.chat_id === sess.chat_id ? 'text-white' : 'text-[var(--ink-muted)]'}`}>{sess.count} messages · {sess.last_time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
          <div className="min-w-0">
            {selectedSession ? (
              <div className="flex min-h-[420px] flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[var(--border)] p-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black uppercase text-[var(--ink)]">{selectedSession.title}</h2>
                    <p className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--ink-muted)]"><Clock className="h-3.5 w-3.5 text-[var(--emerald)]" aria-hidden="true" />{selectedSession.last_time} · {selectedSession.count} Messages</p>
                  </div>
                  <button onClick={() => onResumeSession(selectedSession.chat_id)} className="neo-btn neo-btn-primary px-4 py-2.5 text-xs">Resume <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></button>
                </div>
                <div className="max-h-[560px] overflow-y-auto p-4 md:p-6">
                  <div className="mx-auto flex max-w-3xl flex-col gap-4">
                    {selectedSession.messages.map((msg, index) => (
                      <article key={index} className={`border-2 border-[var(--border)] p-4 shadow-[3px_3px_0_var(--border)] ${msg.role === 'user' ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--surface)]'}`}>
                        <p className={`section-label mb-2 ${msg.role === 'user' ? 'text-[var(--paper)] opacity-80' : ''}`}>{msg.role === 'user' ? 'Student' : 'AI Tutor'}</p>
                        {msg.role === 'user' ? (<p className="whitespace-pre-line text-[14px] font-medium">{msg.content}</p>) : (<MarkdownRenderer content={msg.content} />)}
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <EmptyState icon={History} title="Select a session" body="Choose a past discussion to review calculations and tutor explanations." actionLabel={sidebarVisible ? undefined : 'Show sessions'} onAction={sidebarVisible ? undefined : toggleSidebar} />
              </div>
            )}
          </div>
        </div>
      </div>
      {sidebarVisible && !isDesktop && (<button className="fixed inset-0 z-[130] bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sessions" />)}
    </div>
  );
};
export default HistoryPage;
