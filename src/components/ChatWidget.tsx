'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-96 h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
            <div>
              <p className="text-white font-semibold text-sm">AEM Knowledge Assistant</p>
              <p className="text-slate-400 text-xs">Powered by AEM Content Fragments + Gemini</p>
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
                <p className="text-slate-400 text-sm">Ask anything about AEM, AEP, or AJO</p>
                <div className="mt-4 space-y-2">
                  {[
                    'How do I configure CORS for AEM GraphQL?',
                    'What is a Content Fragment?',
                    'Difference between SPA Editor and Universal Editor?',
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
