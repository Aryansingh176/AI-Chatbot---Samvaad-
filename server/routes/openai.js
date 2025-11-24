const express = require('express');
const Groq = require('groq-sdk');
const verifyToken = require('../middleware/auth');

const router = express.Router();

let groqClient;

// Initialize Groq client
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  console.log('[OpenAI Routes] Groq client initialized successfully');
}

// POST /api/openai/chat - Chat with OpenAI
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log('[OpenAI Chat] Request received:', { prompt });

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    if (!groqClient) {
      console.error('[OpenAI Chat] Groq client not initialized');
      return res.status(500).json({ error: 'AI service not available' });
    }

    console.log('[OpenAI Chat] Calling Groq API with prompt:', prompt);

    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('[OpenAI Chat] Groq response received:', JSON.stringify(response, null, 2));

    const reply = response.choices?.[0]?.message?.content || '';

    if (!reply) {
      console.error('[OpenAI Chat] No content in response choices');
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    console.log('[OpenAI Chat] Reply extracted:', reply);

    res.json({ reply });
  } catch (error) {
    console.error('[OpenAI Chat] Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type,
      headers: error.headers,
      fullError: JSON.stringify(error, null, 2),
    });

    res.status(500).json({
      error: error.message || 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
