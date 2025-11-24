const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const Usage = require('../models/Usage');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');

let groqClient = null;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('[Chat Routes] Groq client initialized successfully');
} else {
  console.warn('[Chat Routes] WARNING: GROQ_API_KEY is not set in .env');
}

const languages = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese',
  ar: 'Arabic',
  pt: 'Portuguese',
  de: 'German',
  ja: 'Japanese',
  ru: 'Russian'
};

const languageResponses = {
  en: {
    greeting: 'Hello! How can I assist you today?',
    goodbye: 'Thank you for chatting! Have a great day!',
    help: 'I can help you with various topics. Feel free to ask me anything!'
  },
  hi: {
    greeting: 'नमस्ते! मैं आपकी क्या मदद कर सकता हूँ?',
    goodbye: 'चैट करने के लिए धन्यवाद! आपका दिन शुभ हो!',
    help: 'मैं आपको विभिन्न विषयों में मदद कर सकता हूँ। बेझिझक मुझसे कुछ भी पूछें!'
  },
  es: {
    greeting: '¡Hola! ¿Cómo puedo ayudarte hoy?',
    goodbye: '¡Gracias por chatear! ¡Que tengas un gran día!',
    help: 'Puedo ayudarte con varios temas. ¡No dudes en preguntarme anything!'
  },
  fr: {
    greeting: 'Bonjour! Comment puis-je vous aider?',
    goodbye: 'Merci de discuter! Passez une excellente journée!',
    help: 'Je peux vous aider sur divers sujets. N\'hésitez pas à me poser des questions!'
  },
  zh: {
    greeting: '你好！我今天能如何帮助你？',
    goodbye: '感谢您的聊天！祝你有美好的一天！',
    help: '我可以帮助您处理各种主题。随时问我任何问题！'
  },
  ar: {
    greeting: 'مرحبا! كيف يمكنني مساعدتك اليوم؟',
    goodbye: 'شكرا على الدردشة! وداعا!',
    help: 'يمكنني مساعدتك في مواضيع مختلفة. لا تتردد في السؤال!'
  },
  pt: {
    greeting: 'Olá! Como posso ajudá-lo hoje?',
    goodbye: 'Obrigado por conversar! Tenha um ótimo dia!',
    help: 'Posso ajudar você com vários tópicos. Sinta-se à vontade para perguntar!'
  },
  de: {
    greeting: 'Hallo! Wie kann ich dir heute helfen?',
    goodbye: 'Danke fürs Chatten! Einen schönen Tag noch!',
    help: 'Ich kann dir bei verschiedenen Themen helfen. Frag mich gerne alles!'
  },
  ja: {
    greeting: 'こんにちは！今日はどのようにお手伝いできますか？',
    goodbye: 'チャットをありがとう！良い一日を！',
    help: '様々なトピックでお手伝いできます。何でも遠慮なく聞いてください！'
  },
  ru: {
    greeting: 'Привет! Чем я могу вам помочь?',
    goodbye: 'Спасибо за чат! Хорошего дня!',
    help: 'Я могу помочь вам по различным темам. Не стесняйтесь спрашивать!'
  }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // token payload may contain userId (from auth routes) — support both keys
    req.userId = decoded.userId || decoded.id || decoded._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/languages', (req, res) => {
  res.json(languages);
});

// POST / endpoint - NO auth required for now
router.post('/', async (req, res) => {
  try {
    console.log('[CHAT] Got message:', req.body);
    const { message } = req.body;
    if (!message) {
      console.log('[CHAT] No message in request');
      return res.status(400).json({ assistant: 'No message' });
    }
    
    if (!groqClient) {
      console.log('[CHAT] Groq client not initialized');
      return res.status(500).json({ assistant: 'No AI' });
    }
    
    console.log('[CHAT] Calling Groq API with model: llama-3.3-70b-versatile');
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message }
      ],
      max_tokens: 300
    });

    console.log('[CHAT] Groq response received:', response?.choices?.[0]?.message);
    const text = response?.choices?.[0]?.message?.content?.trim();
    res.json({ assistant: text || 'No response' });
    
  } catch (error) {
    console.error('[CHAT ERROR]', error?.message);
    console.error('[CHAT ERROR STACK]', error?.stack);
    res.status(500).json({ assistant: 'Error: ' + error?.message });
  }
});

router.post('/send-message', verifyToken, async (req, res) => {
  try {
    const { message, language, useAI } = req.body;

    console.log('[Chat] Received message:', { message, language, useAI, userId: req.userId });

    if (!message || !language) {
      return res.status(400).json({ message: 'Message and language are required' });
    }

    if (!languageResponses[language]) {
      return res.status(400).json({ message: 'Language not supported' });
    }

    let chat = await Chat.findOne({ userId: req.userId, language });

    if (!chat) {
      chat = new Chat({
        userId: req.userId,
        language,
        messages: []
      });
    }

    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    let aiResponse;

    // If client exists and useAI is not explicitly false, call OpenAI
    if (openaiClient && useAI !== false) {
      try {
        console.log('[Chat] Calling OpenAI API...');
        const systemPrompt = `You are a helpful multilingual assistant. Respond in ${languages[language]} language. Be concise and do not repeat yourself. Keep responses under 200 words.`;

        const messagesForModel = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ];

        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messagesForModel,
          max_tokens: 300,
          temperature: 0.7
        });

        aiResponse = completion.choices?.[0]?.message?.content?.trim();

        if (!aiResponse) {
          console.warn('[Chat] No response from OpenAI, using fallback');
          aiResponse = generateResponse(message, language);
        } else {
          console.log('[Chat] OpenAI response success:', aiResponse.slice(0, 100));
        }

        // Record token usage
        if (completion.usage) {
          try {
            await Usage.create({
              userId: req.userId,
              promptTokens: completion.usage.prompt_tokens || 0,
              completionTokens: completion.usage.completion_tokens || 0,
              totalTokens: completion.usage.total_tokens || 0,
              language
            });
          } catch (uErr) {
            console.error('[Chat] Error recording usage:', uErr.message);
          }
        }
      } catch (err) {
        console.error('[Chat] OpenAI API error:', err?.message || err);
        aiResponse = generateResponse(message, language);
      }
    } else {
      console.log('[Chat] Using rule-based response');
      aiResponse = generateResponse(message, language);
    }

    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await chat.save();

    res.json({
      userMessage: message,
      aiResponse: aiResponse,
      language: language,
      conversationId: chat._id
    });
  } catch (error) {
    console.error('[Chat] Error sending message:', error);
    res.status(500).json({ message: 'Error processing message' });
  }
});

// Usage endpoint — returns aggregated usage and call counts for the current user
router.get('/usage', verifyToken, async (req, res) => {
  try {
    const agg = await Usage.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          promptTokens: { $sum: '$promptTokens' },
          completionTokens: { $sum: '$completionTokens' },
          calls: { $sum: 1 }
        }
      }
    ]);

    const result = agg[0] || { totalTokens: 0, promptTokens: 0, completionTokens: 0, calls: 0 };
    res.json({ totalTokens: result.totalTokens, promptTokens: result.promptTokens, completionTokens: result.completionTokens, calls: result.calls });
  } catch (err) {
    console.error('Error fetching usage:', err);
    res.status(500).json({ message: 'Error fetching usage' });
  }
});

router.get('/conversation/:language', verifyToken, async (req, res) => {
  try {
    const { language } = req.params;

    if (!languageResponses[language]) {
      return res.status(400).json({ message: 'Language not supported' });
    }

    const chat = await Chat.findOne({ userId: req.userId, language });

    if (!chat) {
      return res.json({ messages: [], language });
    }

    res.json({ messages: chat.messages, language, conversationId: chat._id });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Error fetching conversation' });
  }
});

router.post('/clear-conversation/:language', verifyToken, async (req, res) => {
  try {
    const { language } = req.params;

    await Chat.deleteOne({ userId: req.userId, language });

    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ message: 'Error clearing conversation' });
  }
});

function generateResponse(userMessage, language) {
  const lowercaseMessage = userMessage.toLowerCase();

  const greetings = ['hello', 'hi', 'hey', 'hola', 'bonjour', 'hallo', 'namaste', 'nǐ hǎo'];
  const goodbyes = ['bye', 'goodbye', 'farewell', 'adios', 'au revoir', 'auf wiedersehen'];
  const helpQueries = ['help', 'assist', 'support', 'how can you help'];

  for (let greeting of greetings) {
    if (lowercaseMessage.includes(greeting)) {
      return languageResponses[language].greeting;
    }
  }

  for (let goodbye of goodbyes) {
    if (lowercaseMessage.includes(goodbye)) {
      return languageResponses[language].goodbye;
    }
  }

  for (let help of helpQueries) {
    if (lowercaseMessage.includes(help)) {
      return languageResponses[language].help;
    }
  }

  const responses = {
    en: [
      'That\'s interesting! Could you tell me more?',
      'I understand. How can I help you further?',
      'That sounds important. Let me assist you.',
      'Thank you for sharing that information.',
      'I\'m here to help. What else can I do?'
    ],
    hi: [
      'यह दिलचस्प है! क्या आप मुझे और बता सकते हैं?',
      'मैं समझता हूँ। मैं आपकी और कैसे मदद कर सकता हूँ?',
      'यह महत्वपूर्ण लगता है। मुझे आपकी मदद करने दीजिए।',
      'जानकारी साझा करने के लिए धन्यवाद।',
      'मैं आपकी मदद के लिए यहाँ हूँ। मैं और क्या कर सकता हूँ?'
    ],
    es: [
      '¡Eso es interesante! ¿Puedes contarme más?',
      'Entiendo. ¿Cómo puedo ayudarte más?',
      'Eso suena importante. Déjame ayudarte.',
      'Gracias por compartir esa información.',
      'Estoy aquí para ayudar. ¿Qué más puedo hacer?'
    ],
    fr: [
      'C\'est intéressant! Pouvez-vous m\'en dire plus?',
      'Je comprends. Comment puis-je vous aider davantage?',
      'Cela semble important. Laissez-moi vous aider.',
      'Merci de partager ces informations.',
      'Je suis là pour vous aider. Que d\'autre puis-je faire?'
    ],
    zh: [
      '那很有趣！你能告诉我更多吗？',
      '我明白了。我还能如何帮助你？',
      '听起来很重要。让我帮助你。',
      '感谢您分享这些信息。',
      '我在这里帮助你。我还能做什么？'
    ],
    ar: [
      'هذا مثير للاهتمام! هل يمكنك أن تخبرني بالمزيد؟',
      'أفهم. كيف يمكنني مساعدتك أكثر؟',
      'يبدو ذلك مهماً. اسمح لي بمساعدتك.',
      'شكرا لمشاركة هذه المعلومات.',
      'أنا هنا للمساعدة. ماذا يمكنني أن أفعل أيضا؟'
    ],
    pt: [
      'Isso é interessante! Você pode me contar mais?',
      'Eu entendo. Como posso ajudá-lo mais?',
      'Isso parece importante. Deixe-me ajudá-lo.',
      'Obrigado por compartilhar essas informações.',
      'Estou aqui para ajudar. O que mais posso fazer?'
    ],
    de: [
      'Das ist interessant! Kannst du mir mehr erzählen?',
      'Ich verstehe. Wie kann ich dir weiterhelfen?',
      'Das klingt wichtig. Lass mich dir helfen.',
      'Danke, dass du diese Informationen geteilt hast.',
      'Ich bin hier, um zu helfen. Was kann ich noch tun?'
    ],
    ja: [
      'それは興味深いです！もっと教えてくれませんか？',
      'わかりました。他にどのようにお手伝いできますか？',
      'それは重要に聞こえます。お手伝いさせてください。',
      'この情報を共有してくれてありがとう。',
      '私はここにいます。他に何ができますか？'
    ],
    ru: [
      'Это интересно! Можешь ли ты рассказать мне больше?',
      'Я понимаю. Чем я могу вам помочь?',
      'Это звучит важно. Позволь мне помочь тебе.',
      'Спасибо за то, что поделились этой информацией.',
      'Я здесь, чтобы помочь. Что еще я могу сделать?'
    ]
  };

  const langResponses = responses[language] || responses['en'];
  return langResponses[Math.floor(Math.random() * langResponses.length)];
}

module.exports = router;
