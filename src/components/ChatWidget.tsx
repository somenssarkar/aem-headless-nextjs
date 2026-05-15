'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  'aem-cf':    { label: 'AEM CF',    className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'eds':       { label: 'AEM EDS',   className: 'bg-green-100 text-green-700 border-green-200' },
  'wordpress': { label: 'WordPress', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  'drupal':    { label: 'Drupal',    className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

function inferSourcesFromText(text: string): string[] {
  const found: string[] = [];
  if (/\bAEM CF\b|\bContent Fragment/i.test(text)) found.push('aem-cf');
  if (/\bAEM EDS\b|\bEdge Delivery/i.test(text)) found.push('eds');
  if (/\bWordPress\b|\bWPGraphQL\b/i.test(text)) found.push('wordpress');
  if (/\bDrupal\b/i.test(text)) found.push('drupal');
  return found;
}

function SourceBadges({ text }: { text: string }) {
  const sources = inferSourcesFromText(text);
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
      {sources.map(src => {
        const badge = SOURCE_BADGES[src];
        if (!badge) return null;
        return (
          <span
            key={src}
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'chat-toggle', open }, '*');
    }
  }, [open]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage({ text });
  }

  function askSuggested(q: string) {
    if (isLoading) return;
    sendMessage({ text: q });
  }

  return (
    <div data-chat-widget className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-96 h-[540px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
            <div>
              <p className="text-white font-semibold text-sm">AEM Knowledge Assistant</p>
              <p className="text-slate-400 text-xs">AEM CF · EDS · WordPress · Drupal · Gemini</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center pt-8">
                <p className="text-slate-400 text-sm">Ask anything across AEM, EDS, WordPress, or Drupal</p>
                <div className="mt-4 space-y-2">
                  {[
                    'What is a Content Fragment in AEM?',
                    'How does WPGraphQL compare to AEM GraphQL?',
                    'What is the source adapter pattern?',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => askSuggested(q)}
                      className="block w-full text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-400 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(m => {
              const text = m.parts
                .filter(p => p.type === 'text')
                .map(p => (p as { type: 'text'; text: string }).text)
                .join('');
              return (
                <div
                  key={m.id}
                  className={`rounded-xl p-3 text-sm ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white ml-6'
                      : 'bg-white border border-slate-200 text-slate-800 mr-6'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <p className="text-xs font-medium text-slate-400 mb-1">Assistant</p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                  {m.role === 'assistant' && (
                    <SourceBadges text={text} />
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 mr-6">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:bg-slate-700 transition-colors text-xl"
          aria-label="Open AI assistant"
        >
          💬
        </button>
      )}
    </div>
  );
}
