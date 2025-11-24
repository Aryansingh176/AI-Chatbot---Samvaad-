/**
 * LLM Utility Functions
 * Abstraction layer for calling various LLM APIs
 */

/**
 * Generate a reply using an LLM
 * This is a stub that can be replaced with OpenAI, Anthropic, or other providers
 * 
 * @param {string} systemPrompt - System instructions for the LLM
 * @param {string} userPrompt - User's message/query
 * @returns {Promise<string>} - LLM response text
 */
export async function replyLLM(systemPrompt, userPrompt) {
  // Check if LLM API key is configured
  const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

  if (!LLM_API_KEY) {
    console.warn('[LLM] No API key configured, returning dummy response');
    return 'This is a dummy response. Configure LLM_API_KEY or OPENAI_API_KEY to enable real LLM responses.';
  }

  /**
   * EXAMPLE: OpenAI Implementation (uncomment and configure to use)
   * 
   * Required: npm install openai
   * Environment variable: OPENAI_API_KEY=sk-...
   * 
   * import { OpenAI } from 'openai';
   * 
   * const openai = new OpenAI({
   *   apiKey: process.env.OPENAI_API_KEY
   * });
   * 
   * try {
   *   const completion = await openai.chat.completions.create({
   *     model: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo'
   *     messages: [
   *       { role: 'system', content: systemPrompt },
   *       { role: 'user', content: userPrompt }
   *     ],
   *     max_tokens: 300,
   *     temperature: 0.7
   *   });
   *   
   *   return completion.choices[0].message.content;
   * } catch (error) {
   *   console.error('[OpenAI Error]', error.message);
   *   throw new Error(`LLM API error: ${error.message}`);
   * }
   */

  /**
   * EXAMPLE: Anthropic Claude Implementation
   * 
   * Required: npm install @anthropic-ai/sdk
   * Environment variable: ANTHROPIC_API_KEY=sk-ant-...
   * 
   * import Anthropic from '@anthropic-ai/sdk';
   * 
   * const anthropic = new Anthropic({
   *   apiKey: process.env.ANTHROPIC_API_KEY
   * });
   * 
   * try {
   *   const message = await anthropic.messages.create({
   *     model: 'claude-3-5-sonnet-20241022',
   *     max_tokens: 300,
   *     messages: [
   *       { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
   *     ]
   *   });
   *   
   *   return message.content[0].text;
   * } catch (error) {
   *   console.error('[Anthropic Error]', error.message);
   *   throw new Error(`LLM API error: ${error.message}`);
   * }
   */

  // Stub implementation - replace with actual LLM call above
  throw new Error('LLM not configured. Set OPENAI_API_KEY or implement replyLLM() with your preferred LLM provider.');
}

/**
 * Build a context-aware prompt from search results and chat history
 * @param {Array} docs - Documents from search/retrieval
 * @param {Array} history - Chat history [{role, text}]
 * @param {string} currentMessage - Current user message
 * @returns {{systemPrompt: string, userPrompt: string}}
 */
export function buildPrompt(docs, history, currentMessage) {
  // System prompt
  const systemPrompt = `You are a concise, helpful assistant. Provide clear and brief answers. If you need clarification, ask one short question.`;

  // Build context from documents
  let context = '';
  if (docs && docs.length > 0) {
    context = 'Relevant information:\n';
    docs.forEach((doc, idx) => {
      const excerpt = doc.body ? doc.body.substring(0, 150) + '...' : '';
      context += `${idx + 1}. ${doc.title}: ${excerpt}\n`;
    });
    context += '\n';
  }

  // Build history (last 4 turns only)
  let historyText = '';
  if (history && history.length > 0) {
    const recentHistory = history.slice(-4);
    historyText = 'Recent conversation:\n';
    recentHistory.forEach(turn => {
      historyText += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}\n`;
    });
    historyText += '\n';
  }

  // Combine into user prompt
  const userPrompt = `${context}${historyText}Current question: ${currentMessage}`;

  return { systemPrompt, userPrompt };
}

export default {
  replyLLM,
  buildPrompt
};
