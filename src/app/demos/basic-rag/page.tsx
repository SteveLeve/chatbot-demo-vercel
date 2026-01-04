'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { SourcesCard } from './components/SourcesCard';
import type { CustomUIMessage } from '@/types/ui-message';
import { DemoLayout } from '@/components/layouts/DemoLayout';
import type { TechStackInfo } from '@/types/sidebar';

const TECH_STACK: TechStackInfo = {
  title: 'Built with',
  technologies: ['Vercel AI SDK', 'Postgres (Neon)', 'pgvector', 'OpenAI'],
  description: 'Demonstrating RAG patterns with streaming responses',
  githubUrl: 'https://github.com/SteveLeve/chatbot-demo-vercel'
};

export default function BasicRagPage() {
  const { messages, sendMessage, status } = useChat<CustomUIMessage>({
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
    <DemoLayout
      title="Basic RAG Chatbot"
      techStack={TECH_STACK}
      footer={
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
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
              className="w-full p-4 pr-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all shadow-sm"
              value={input}
              placeholder="Type your question..."
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'ready'}
            />
            <button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </form>
        </footer>
      }
    >
      <div className="p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <p className="text-lg">Ask me anything about AI, Machine Learning, or Vercel!</p>
            <p className="text-sm mt-2">Try: "What is RAG?" or "Who founded OpenAI?"</p>
          </div>
        )}

        {messages.map((message) => {
          // Extract sources from message parts (AI SDK v5 RAG pattern with custom data)
          const sourcesPart = message.parts.find(part => part.type === 'data-sources') as any;
          const sources = sourcesPart?.data?.map((source: any) => ({
            content: source.content,
            similarity: source.similarity,
            metadata: {
              title: source.title,
            },
          })) || [];

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? <span key={index}>{part.text}</span> : null
                  )}
                </div>

                {message.role === 'assistant' && sources.length > 0 && (
                  <SourcesCard sources={sources} />
                )}
              </div>
            </div>
          );
        })}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-gray-500 dark:text-gray-400 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </DemoLayout>
  );
}
