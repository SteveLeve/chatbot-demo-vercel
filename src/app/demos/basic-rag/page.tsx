'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function BasicRagPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">Basic RAG Chatbot</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Ask me anything about AI, Machine Learning, or Vercel!</p>
            <p className="text-sm mt-2">Try: "What is RAG?" or "Who founded OpenAI?"</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.parts.map((part, index) =>
                  part.type === 'text' ? <span key={index}>{part.text}</span> : null
                )}
              </div>
            </div>
          </div>
        ))}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 text-gray-500 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
          className="max-w-4xl mx-auto relative"
        >
          <input
            className="w-full p-4 pr-24 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
            value={input}
            placeholder="Type your question..."
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== 'ready'}
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
