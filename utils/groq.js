/**
 * Groq Utility Functions
 * Helper functions for querying Groq API
 */

/**
 * Query Groq API (if you need retrieval/search functionality)
 * Currently your app uses Groq SDK for chat completions
 * This is a placeholder for future retrieval features
 * 
 * @param {string} query - Search query
 * @param {object} params - Additional parameters
 * @returns {Promise<object>} - Search results
 */
export async function queryGroq(query, params = {}) {
  const GROQ_API_URL = process.env.GROQ_API_URL;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_URL || !GROQ_API_KEY) {
    throw new Error('GROQ_API_URL and GROQ_API_KEY must be set in environment');
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        ...params
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Groq Query Error]', error.message);
    throw error;
  }
}

/**
 * Pick top N documents from search results
 * @param {object} results - Groq API results
 * @param {number} n - Number of top docs to return (default: 3)
 * @returns {Array<{title: string, body: string, file: string}>}
 */
export function pickTopDocs(results, n = 3) {
  if (!results || !results.results || !Array.isArray(results.results)) {
    return [];
  }

  return results.results
    .slice(0, n)
    .map(doc => ({
      title: doc.title || 'Untitled',
      body: doc.body || doc.content || '',
      file: doc.file || doc.source || 'unknown'
    }));
}

export default {
  queryGroq,
  pickTopDocs
};
