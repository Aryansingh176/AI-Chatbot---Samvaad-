const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function chatWithAI(prompt: string) {
  const token = localStorage.getItem('authToken');
  
  const res = await fetch(`${API_URL}/openai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || 'Request failed');
  }

  const data = await res.json();
  return data.reply as string;
}
