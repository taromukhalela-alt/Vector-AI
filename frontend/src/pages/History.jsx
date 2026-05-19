import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, MessageSquare, Clock, ArrowRight, BookOpen } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const History = ({ onResumeSession }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSelectSession = async (sess) => {
    try {
      const res = await fetch(`/api/session/${sess.chat_id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSession({
          ...sess,
          messages: data.history || []
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-53px)] md:h-screen overflow-hidden relative">
      {/* Session list sidebar */}
      <aside className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <HistoryIcon className="w-3.5 h-3.5 text-emerald-500" />
            Session Archives
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingHistory ? (
            <div className="space-y-2 p-1">
              <div className="h-10 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
              <div className="h-10 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
              <div className="h-10 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-8">No archived sessions</p>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.chat_id}
                onClick={() => handleSelectSession(sess)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold truncate flex flex-col gap-1 cursor-pointer transition-colors ${
                  selectedSession?.chat_id === sess.chat_id
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sess.title || 'Untitled Session'}</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-medium ml-5">{sess.count} messages &middot; {sess.last_time}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main detail workspace */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {selectedSession ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3 bg-zinc-100/20 dark:bg-zinc-900/10">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-zinc-800 dark:text-zinc-100 leading-tight">{selectedSession.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    {selectedSession.last_time}
                  </span>
                  <span>&middot;</span>
                  <span>{selectedSession.count} Messages</span>
                </div>
              </div>

              <button
                onClick={() => onResumeSession(selectedSession.chat_id)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                Resume Active Chat
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            </div>

            {/* Messages body thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {selectedSession.messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-zinc-200 border-zinc-300/50 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-100 self-end rounded-tr-none'
                        : 'bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/40 text-zinc-800 dark:text-zinc-100 self-start rounded-tl-none'
                    }`}
                  >
                    <div className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-500 mb-1">
                      {msg.role === 'user' ? 'Student' : 'AI Tutor'}
                    </div>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <HistoryIcon className="w-10 h-10 text-zinc-400 mb-4" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Archive Viewer</h3>
            <p className="text-xs text-zinc-400 mt-1">Select a past discussion thread from the sidebar to review science calculations, code, or tutor conversations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
