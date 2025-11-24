import React, { useState } from 'react';
import { chatWithAI } from '../lib/api';

export default function OpenAIChat() {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReply('');
    try {
      const r = await chatWithAI(prompt);
      setReply(r);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-medium">Ask the AI</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full p-2 border rounded"
          placeholder="Type a prompt..."
        />
        <div className="mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </form>

      {error && <div className="mt-3 text-red-600">Error: {error}</div>}

      {reply && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <div className="font-semibold mb-1">AI Reply</div>
          <div>{reply}</div>
        </div>
      )}
    </div>
  );
}
