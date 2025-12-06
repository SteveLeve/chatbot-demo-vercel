import Link from 'next/link';

export default function Home() {
  return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Vercel AI Demo Portfolio</h1>
              <p className="text-gray-600 text-center mb-8">
                  A collection of AI demonstrations built with the Vercel AI SDK, Next.js, and Neon.
              </p>

              <div className="grid gap-4">
                  <Link href="/demos/basic-rag" className="block p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group">
                      <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 mb-2">Basic RAG Chatbot</h2>
                      <p className="text-gray-600">
                          A simple Retrieval-Augmented Generation chatbot using Wikipedia data.
                          Demonstrates vector search and context injection.
                      </p>
                  </Link>

                  {/* Future demos will go here */}
                  <div className="p-6 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                      <h2 className="text-xl font-semibold text-gray-400 mb-2">Advanced RAG (Coming Soon)</h2>
                      <p className="text-gray-400">
                          Refinement, reranking, and agentic search patterns.
                      </p>
                  </div>
              </div>
          </div>
    </div>
  );
}
