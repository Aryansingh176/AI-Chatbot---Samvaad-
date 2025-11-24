import { useState, useEffect, useRef } from 'react';
import { Send, X, Loader, Globe, MessageSquare, UserCog, Mic, Volume2, Package, DollarSign, KeyRound, ShoppingBag } from 'lucide-react';
import { saveMessagePair } from '../utils/chatHistory';
import { createAgentSession, addMessageToSession, SessionPolling, type AgentMessage } from '../utils/agentHandoff';
import { getCurrentLanguage, onLanguageChange, type SupportedLanguage } from '../utils/languageManager';
import { extractEntities, formatEntitiesForAPI, getEntityIcon, getEntityColorClass, type ExtractedEntity } from '../utils/entityExtractor';
import FeedbackModal from './FeedbackModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  entities?: ExtractedEntity[];
}

interface ChatBotProps {
  onClose: () => void;
  initialLanguage?: string;
  autoGreet?: boolean;
  loadedConversation?: {
    id: string;
    title: string;
    messages: Array<{ id: string; text: string; isUser: boolean; timestamp: number }>;
  } | null;
}

const LANGUAGES = {
  en: 'English',
  hi: 'हिंदी',
  bn: 'বাংলা',
  mr: 'मराठी',
  es: 'Español',
  fr: 'Français',
  zh: '中文',
  ar: 'العربية',
  pt: 'Português',
  de: 'Deutsch',
  ja: '日本語',
  ru: 'Русский'
};

const GREETINGS: Record<string, string> = {
  en: 'Hello! How can I assist you today?',
  hi: 'नमस्ते! मैं आपकी क्या मदद कर सकता हूँ?',
  bn: 'হ্যালো! আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  mr: 'नमस्कार! आज मी तुम्हाला कशी मदत करू शकतो?',
  es: '¡Hola! ¿Cómo puedo ayudarte hoy?',
  fr: 'Bonjour! Comment puis-je vous aider?',
  zh: '你好！我今天能如何帮助你？',
  ar: 'مرحبا! كيف يمكنني مساعدتك اليوم؟',
  pt: 'Olá! Como posso ajudá-lo hoje?',
  de: 'Hallo! Wie kann ich dir heute helfen?',
  ja: 'こんにちは！今日はどのようにお手伝いできますか？',
  ru: 'Привет! Чем я могу вам помочь?'
};

const QUICK_ACTIONS = [
  {
    id: 'track-order',
    icon: Package,
    labels: {
      en: 'Track Order',
      hi: 'ऑर्डर ट्रैक करें',
      bn: 'অর্ডার ট্র্যাক করুন',
      mr: 'ऑर्डर ट्रॅक करा',
      es: 'Rastrear Pedido',
      fr: 'Suivre Commande',
      zh: '追踪订单',
      ar: 'تتبع الطلب',
      pt: 'Rastrear Pedido',
      de: 'Bestellung verfolgen',
      ja: '注文を追跡',
      ru: 'Отследить заказ'
    },
    messages: {
      en: 'I want to track my order',
      hi: 'मैं अपने ऑर्डर को ट्रैक करना चाहता हूं',
      bn: 'আমি আমার অর্ডার ট্র্যাক করতে চাই',
      mr: 'मला माझा ऑर्डर ट्रॅक करायचा आहे',
      es: 'Quiero rastrear mi pedido',
      fr: 'Je veux suivre ma commande',
      zh: '我想追踪我的订单',
      ar: 'أريد تتبع طلبي',
      pt: 'Quero rastrear meu pedido',
      de: 'Ich möchte meine Bestellung verfolgen',
      ja: '注文を追跡したい',
      ru: 'Я хочу отследить мой заказ'
    }
  },
  {
    id: 'refund-status',
    icon: DollarSign,
    labels: {
      en: 'Refund Status',
      hi: 'रिफंड स्थिति',
      bn: 'রিফান্ড স্ট্যাটাস',
      mr: 'परतावा स्थिती',
      es: 'Estado Reembolso',
      fr: 'Statut Remboursement',
      zh: '退款状态',
      ar: 'حالة الاسترداد',
      pt: 'Status Reembolso',
      de: 'Erstattungsstatus',
      ja: '返金状況',
      ru: 'Статус возврата'
    },
    messages: {
      en: 'What is the status of my refund?',
      hi: 'मेरे रिफंड की स्थिति क्या है?',
      bn: 'আমার রিফান্ডের স্ট্যাটাস কী?',
      mr: 'माझ्या परताव्याची स्थिती काय आहे?',
      es: '¿Cuál es el estado de mi reembolso?',
      fr: 'Quel est le statut de mon remboursement?',
      zh: '我的退款状态是什么？',
      ar: 'ما هي حالة استرداد أموالي؟',
      pt: 'Qual é o status do meu reembolso?',
      de: 'Wie ist der Status meiner Erstattung?',
      ja: '返金の状況はどうなっていますか？',
      ru: 'Каков статус моего возврата?'
    }
  },
  {
    id: 'reset-password',
    icon: KeyRound,
    labels: {
      en: 'Reset Password',
      hi: 'पासवर्ड रीसेट करें',
      bn: 'পাসওয়ার্ড রিসেট করুন',
      mr: 'पासवर्ड रीसेट करा',
      es: 'Restablecer Contraseña',
      fr: 'Réinitialiser Mot de Passe',
      zh: '重置密码',
      ar: 'إعادة تعيين كلمة المرور',
      pt: 'Redefinir Senha',
      de: 'Passwort zurücksetzen',
      ja: 'パスワードをリセット',
      ru: 'Сбросить пароль'
    },
    messages: {
      en: 'I need help resetting my password',
      hi: 'मुझे अपना पासवर्ड रीसेट करने में मदद चाहिए',
      bn: 'আমার পাসওয়ার্ড রিসেট করতে সাহায্য দরকার',
      mr: 'मला माझा पासवर्ड रीसेट करण्यात मदत हवी आहे',
      es: 'Necesito ayuda para restablecer mi contraseña',
      fr: 'J\'ai besoin d\'aide pour réinitialiser mon mot de passe',
      zh: '我需要帮助重置密码',
      ar: 'أحتاج إلى مساعدة في إعادة تعيين كلمة المرور',
      pt: 'Preciso de ajuda para redefinir minha senha',
      de: 'Ich brauche Hilfe beim Zurücksetzen meines Passworts',
      ja: 'パスワードのリセットを手伝ってください',
      ru: 'Мне нужна помощь в сбросе пароля'
    }
  },
  {
    id: 'product-inquiry',
    icon: ShoppingBag,
    labels: {
      en: 'Product Inquiry',
      hi: 'उत्पाद पूछताछ',
      bn: 'পণ্য অনুসন্ধান',
      mr: 'उत्पादन चौकशी',
      es: 'Consulta Producto',
      fr: 'Demande Produit',
      zh: '产品咨询',
      ar: 'استفسار المنتج',
      pt: 'Consulta Produto',
      de: 'Produktanfrage',
      ja: '製品に関するお問い合わせ',
      ru: 'Запрос о продукте'
    },
    messages: {
      en: 'I have a question about a product',
      hi: 'मेरे पास एक उत्पाद के बारे में सवाल है',
      bn: 'আমার একটি পণ্য সম্পর্কে প্রশ্ন আছে',
      mr: 'मला एका उत्पादनाबद्दल प्रश्न आहे',
      es: 'Tengo una pregunta sobre un producto',
      fr: 'J\'ai une question sur un produit',
      zh: '我有一个关于产品的问题',
      ar: 'لدي سؤال حول منتج',
      pt: 'Tenho uma pergunta sobre um produto',
      de: 'Ich habe eine Frage zu einem Produkt',
      ja: '製品について質問があります',
      ru: 'У меня есть вопрос о продукте'
    }
  }
];

export default function ChatBot({ onClose, initialLanguage, autoGreet, loadedConversation, ...rest }: ChatBotProps & { standalone?: boolean }) {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof LANGUAGES>(
    initialLanguage || getCurrentLanguage()
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [chatTopics, setChatTopics] = useState<string[]>([]);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [usage, setUsage] = useState<{ totalTokens: number; calls: number }>({ totalTokens: 0, calls: 0 });
  const [failedResponseCount, setFailedResponseCount] = useState(0);
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeText, setWelcomeText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollingRef = useRef<SessionPolling | null>(null);
  const recognitionRef = useRef<any>(null);
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  // Typing animation for welcome message
  useEffect(() => {
    if (showWelcome && messages.length === 0) {
      const fullText = `👋 Welcome! I'm SAMVAAD AI Assistant. ${GREETINGS[selectedLanguage]}`;
      let currentIndex = 0;
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setWelcomeText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 30);
      
      return () => clearInterval(typingInterval);
    }
  }, [showWelcome, messages.length, selectedLanguage]);

  // Listen for global language changes
  useEffect(() => {
    const cleanup = onLanguageChange((newLang) => {
      if (Object.keys(LANGUAGES).includes(newLang)) {
        setSelectedLanguage(newLang as keyof typeof LANGUAGES);
      }
    });
    return cleanup;
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = getLanguageCode(selectedLanguage);

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  // Helper function to map language codes for speech recognition
  const getLanguageCode = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      es: 'es-ES',
      fr: 'fr-FR',
      zh: 'zh-CN',
      ar: 'ar-SA',
      pt: 'pt-BR',
      de: 'de-DE',
      ja: 'ja-JP',
      ru: 'ru-RU'
    };
    return langMap[lang] || 'en-US';
  };

  // Handle quick action button click
  const handleQuickAction = async (actionId: string) => {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (!action || !token || loading) return;

    const message = action.messages[selectedLanguage as keyof typeof action.messages] || action.messages.en;
    
    // Set the input value first for visual feedback
    setInputValue(message);
    
    // Wait a bit then trigger the send
    setTimeout(() => {
      // Programmatically create and dispatch form submission
      if (!loading && message.trim()) {
        const syntheticEvent = {
          preventDefault: () => {},
        } as React.FormEvent;
        handleSendMessageWrapper(syntheticEvent);
      }
    }, 150);
  };

  // Start voice input
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = getLanguageCode(selectedLanguage);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
  };

  // Stop voice input
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Text-to-speech for bot messages
  const speakMessage = (text: string, messageIndex: number) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      if (isSpeaking === messageIndex) {
        setIsSpeaking(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(selectedLanguage);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(messageIndex);
      };

      utterance.onend = () => {
        setIsSpeaking(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle close with feedback prompt
  const handleClose = () => {
    // Only show feedback if user has sent at least 2 messages
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    if (userMessageCount >= 2 && !showFeedbackModal) {
      setShowFeedbackModal(true);
    } else {
      onClose();
    }
  };

  // Extract topics from user messages
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const topics = userMessages.slice(0, 3).map(m => m.content.slice(0, 50));
    setChatTopics(topics);
  }, [messages]);

  useEffect(() => {
    // If a conversation is loaded from history, use it instead of fetching
    if (loadedConversation && loadedConversation.messages.length > 0) {
      const convertedMessages: Message[] = loadedConversation.messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
        timestamp: new Date(msg.timestamp).toISOString()
      }));
      setMessages(convertedMessages);
      setConversationLoaded(true);
    } else {
      fetchConversation();
    }
    fetchUsage();
  }, [selectedLanguage, loadedConversation]);

  // focus the input when the chatbot opens or when conversation loads
  useEffect(() => {
    if (conversationLoaded) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [conversationLoaded, selectedLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    if (!token) return;

    try {
      setConversationLoaded(false);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/conversation/${selectedLanguage}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      const msgs = data.messages || [];
      if ((msgs.length === 0 || !msgs) && autoGreet) {
        const greet = GREETINGS[selectedLanguage as string] || `Hello!`;
        setMessages([
          { role: 'assistant', content: greet, timestamp: new Date().toISOString() }
        ]);
      } else {
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setConversationLoaded(true);
    }
  };

  // react to initialLanguage prop changes (if any)
  useEffect(() => {
    if (initialLanguage) {
      setSelectedLanguage(initialLanguage as keyof typeof LANGUAGES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;
    
    if (!token) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Please sign in to use the chat. Click the "Sign In" button in the header.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const messageText = inputValue.trim();
    
    // Extract entities from user message
    const entityResult = extractEntities(messageText);
    
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      entities: entityResult.entities
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      console.log('[ChatBot] Sending message:', messageText);
      console.log('[ChatBot] Extracted entities:', entityResult.entities);
      
      // Build message with entity context
      const messageWithContext = entityResult.hasEntities 
        ? `${messageText} ${formatEntitiesForAPI(entityResult.entities)}`
        : messageText;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageWithContext
        })
      });

      const data = await response.json();

      if (response.ok && data.assistant) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.assistant,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Save to chat history
        saveMessagePair(messageText, data.assistant);
        
        // Reset failed count on success
        setFailedResponseCount(0);
        
        console.log('[ChatBot] AI response received');
      } else {
        console.error('[ChatBot] Error:', data.assistant || 'No response');
        const errorMessage: Message = {
          role: 'assistant',
          content: data.assistant || 'Sorry, I couldn\'t generate a response. Please try again.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
        
        // Increment failed response count
        setFailedResponseCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('[ChatBot] Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Increment failed response count
      setFailedResponseCount(prev => prev + 1);
    } finally {
      setLoading(false);
      // Refocus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle agent handoff
  const handleAgentHandoff = async () => {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('Please log in to connect with a human agent.');
      return;
    }

    const userData = JSON.parse(user);
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || 'User needs assistance';
    
    const session = await createAgentSession(
      userData.email,
      userData.name,
      lastUserMessage,
      failedResponseCount
    );
    
    setAgentSessionId(session.id);
    setIsAgentMode(true);
    
    // Add system message
    const systemMessage: Message = {
      role: 'assistant',
      content: '🟢 Connecting you to a human agent. Please wait while we find someone to help you...',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, systemMessage]);
    
    // Start polling for agent responses
    if (!pollingRef.current) {
      pollingRef.current = new SessionPolling();
    }
    
    pollingRef.current.start(session.id, (newMessages: AgentMessage[]) => {
      newMessages.forEach(msg => {
        if (msg.sender === 'agent') {
          const agentMessage: Message = {
            role: 'assistant',
            content: `👤 Agent: ${msg.text}`,
            timestamp: new Date(msg.timestamp).toISOString()
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      });
    });
  };

  // Send message in agent mode
  const sendAgentMessage = async (messageText: string) => {
    if (!agentSessionId) return;
    
    await addMessageToSession(agentSessionId, messageText, 'user');
    
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        pollingRef.current.stop();
      }
    };
  }, []);

  // Modified send message handler
  const handleSendMessageWrapper = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAgentMode) {
      if (!inputValue.trim()) return;
      sendAgentMessage(inputValue.trim());
      setInputValue('');
    } else {
      await handleSendMessage(e);
    }
  };

  const fetchUsage = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setUsage({ totalTokens: d.totalTokens || 0, calls: d.calls || 0 });
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  const handleLanguageChange = (lang: keyof typeof LANGUAGES) => {
    setSelectedLanguage(lang);
  };

  const handleClearChat = async () => {
    if (!token || !window.confirm('Are you sure you want to clear this conversation?')) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/chat/clear-conversation/${selectedLanguage}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessages([]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  // determine standalone: prop or query param
  const standalone = (rest && (rest as any).standalone) || (new URLSearchParams(window.location.search).get('openChat') === '1');

  // Render full-window ChatGPT-style layout for standalone
  if (standalone) {
    return (
      <div className="h-screen w-screen bg-[#212121] flex flex-col">
        {/* Sidebar */}
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
            {/* Logo/Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  SAMVAAD AI
                </span>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={handleClearChat}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">New Chat</span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="px-3 py-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-2 block">Language</label>
              <div className="space-y-1">
                {Object.entries(LANGUAGES).slice(0, 5).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code as keyof typeof LANGUAGES)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedLanguage === code
                        ? 'bg-[#2a2a2a] text-white'
                        : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="px-3 py-2 mt-auto border-t border-gray-800">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm text-gray-400">AI Mode</span>
                <button
                  onClick={() => setUseAI(!useAI)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    useAI ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      useAI ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Top Header */}
            <div className="bg-[#171717] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">SAMVAAD AI</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-400 text-xs">{LANGUAGES[selectedLanguage]}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
              <div className="max-w-3xl mx-auto px-4">
                {!conversationLoaded ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <div className="text-center max-w-2xl mx-auto">
                      <div className="bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-3">SAMVAAD AI Assistant</h1>
                      {showWelcome && (
                        <div className="bg-gradient-to-br from-[#2f2f2f] to-[#282828] rounded-2xl px-6 py-4 mb-4 shadow-lg inline-block">
                          <p className="text-gray-200 text-lg leading-relaxed">
                            {welcomeText}
                            <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                          </p>
                        </div>
                      )}
                      <p className="text-gray-400 mt-4">Powered by AI • Multilingual Support</p>
                      <p className="text-gray-500 text-sm mt-2">Available in {LANGUAGES[selectedLanguage]}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-6">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Avatar - only show for AI on left */}
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg" title="SAMVAAD AI Assistant">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={`max-w-xl ${message.role === 'user' ? 'ml-auto' : ''}`}>
                          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm'
                              : 'bg-gradient-to-br from-[#2f2f2f] to-[#282828] text-gray-200 rounded-bl-sm'
                          }`}>
                            <div className="leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                          {/* Entity Tags */}
                          {message.entities && message.entities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {message.entities.map((entity, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                                    message.role === 'user' 
                                      ? 'bg-blue-800/50 text-blue-100 border-blue-700'
                                      : 'bg-gray-800/70 text-gray-200 border-gray-700'
                                  }`}
                                  title={`${entity.type}: ${entity.value}`}
                                >
                                  <span>{getEntityIcon(entity.type)}</span>
                                  <span className="capitalize">{entity.type.replace(/([A-Z])/g, ' $1').trim()}: {entity.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Speaker icon for bot messages */}
                          {message.role === 'assistant' && (
                            <button
                              onClick={() => speakMessage(message.content, index)}
                              className={`mt-1 p-1.5 rounded-lg transition-all duration-200 ${
                                isSpeaking === index
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              aria-label={isSpeaking === index ? 'Stop speaking' : 'Read message aloud'}
                              title={isSpeaking === index ? 'Stop speaking' : 'Read message aloud'}
                            >
                              <Volume2 className={`w-4 h-4 ${isSpeaking === index ? 'animate-pulse' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Avatar - only show for user on right */}
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Y</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-4 justify-start animate-fade-in">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg" title="SAMVAAD AI Assistant">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-[#2f2f2f] to-[#282828] rounded-bl-sm shadow-sm">
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 border-t border-gray-800 p-4 bg-[#212121] shadow-lg">
              <div className="max-w-3xl mx-auto">
                {/* Quick Action Buttons */}
                {!isAgentMode && messages.length === 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      const label = action.labels[selectedLanguage as keyof typeof action.labels] || action.labels.en;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => handleQuickAction(action.id)}
                          disabled={!token || loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#2a2a2a] border border-gray-700 rounded-lg hover:bg-[#3a3a3a] hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {failedResponseCount >= 2 && !isAgentMode && (
                  <button
                    type="button"
                    onClick={handleAgentHandoff}
                    className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <UserCog className="w-5 h-5" />
                    Talk to Human Agent
                  </button>
                )}
                {isAgentMode && (
                  <div className="mb-3 px-4 py-2 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    Connected to human agent
                  </div>
                )}
                <form onSubmit={handleSendMessageWrapper} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isAgentMode ? "Message the agent..." : `Message SAMVAAD AI...`}
                    disabled={loading || !token}
                    className="w-full px-5 py-4 bg-[#2f2f2f] text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-160 disabled:bg-gray-800 disabled:cursor-not-allowed pr-28 shadow-sm"
                  />
                  {/* Microphone button */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading || !token}
                    className={`absolute right-16 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all duration-160 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isListening 
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !inputValue.trim() || !token}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-160 hover:shadow-md"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
                {!token && (
                  <p className="text-sm text-red-400 mt-2 text-center">Please log in to use the chat</p>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">
                  SAMVAAD AI can make mistakes. Consider checking important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal layout for popup mode
  const content = (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] max-h-[600px] flex flex-col animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-4 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">SAMVAAD AI Assistant</h2>
            <p className="text-white/80 text-xs">Powered by AI</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Select Language:</label>
          <div className="flex items-center gap-2">
            <label className="text-sm mr-2">Mode:</label>
            <select value={useAI ? 'ai' : 'rule'} onChange={(e) => setUseAI(e.target.value === 'ai')} className="text-xs px-2 py-1 rounded border">
              <option value="ai">AI</option>
              <option value="rule">Rule-based</option>
            </select>
          </div>
          <button onClick={handleClearChat} disabled={messages.length === 0} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:text-gray-300 transition-colors">
            Clear
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">Usage: {usage.totalTokens} tokens across {usage.calls} calls</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <button key={code} onClick={() => handleLanguageChange(code as keyof typeof LANGUAGES)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedLanguage === code ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ scrollBehavior: 'smooth' }}>
        {!conversationLoaded ? (
          <div className="h-full flex items-center justify-center"><Loader className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <div className="max-w-md">
              <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">SAMVAAD AI Assistant</h3>
              {showWelcome && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-4 py-3 mb-3 border border-gray-200 inline-block">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {welcomeText}
                    <span className="inline-block w-0.5 h-4 bg-blue-600 ml-1 animate-pulse align-middle"></span>
                  </p>
                </div>
              )}
              <p className="text-gray-500 text-sm">Available in {LANGUAGES[selectedLanguage]}</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Bot avatar on the left */}
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm" title="SAMVAAD AI Assistant">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-br-sm' : 'bg-gradient-to-br from-white to-gray-50 text-gray-900 border border-gray-200 rounded-bl-sm'}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                {/* Entity Tags */}
                {message.entities && message.entities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 ml-1">
                    {message.entities.map((entity, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                          getEntityColorClass(entity.type)
                        }`}
                        title={`${entity.type}: ${entity.value}`}
                      >
                        <span>{getEntityIcon(entity.type)}</span>
                        <span className="capitalize">{entity.type.replace(/([A-Z])/g, ' $1').trim()}: {entity.value}</span>
                      </span>
                    ))}
                  </div>
                )}
                {/* Speaker icon for bot messages in modal */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => speakMessage(message.content, index)}
                    className={`self-start ml-1 p-1.5 rounded-lg transition-all duration-200 ${
                      isSpeaking === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    aria-label={isSpeaking === index ? 'Stop speaking' : 'Read message aloud'}
                    title={isSpeaking === index ? 'Stop speaking' : 'Read message aloud'}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking === index ? 'animate-pulse' : ''}`} />
                  </button>
                )}
              </div>
              {/* User avatar on the right */}
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-medium">Y</span>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm" title="SAMVAAD AI Assistant">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 text-gray-900 border border-gray-200 px-4 py-3 rounded-xl rounded-bl-sm shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessageWrapper} className="sticky bottom-0 border-t border-gray-200 p-4 bg-white rounded-b-2xl shadow-lg">
        {/* Quick Action Buttons */}
        {!isAgentMode && messages.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const label = action.labels[selectedLanguage as keyof typeof action.labels] || action.labels.en;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
                  disabled={!token || loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        )}
        {failedResponseCount >= 2 && !isAgentMode && (
          <button
            type="button"
            onClick={handleAgentHandoff}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <UserCog className="w-5 h-5" />
            Talk to Human Agent
          </button>
        )}
        {isAgentMode && (
          <div className="mb-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Connected to human agent
          </div>
        )}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              placeholder={isAgentMode ? "Message the agent..." : `Message SAMVAAD AI...`} 
              disabled={loading || !token} 
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-160 disabled:bg-gray-100 shadow-sm" 
            />
            {/* Microphone button in modal */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={loading || !token}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-160 disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button 
            type="submit" 
            disabled={loading || !inputValue.trim() || !token} 
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all duration-160 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 hover:scale-[1.02] transform"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {!token && <p className="text-xs text-red-600 mt-2">Please log in to use the chat feature</p>}
      </form>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {content}
      </div>
      
      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => {
            setShowFeedbackModal(false);
            onClose();
          }}
          sessionId={agentSessionId || undefined}
          userEmail={user?.email}
          userName={user?.name}
          chatContext={{
            messageCount: messages.length,
            topics: chatTopics,
            duration: Math.floor((Date.now() - sessionStartTime) / 1000),
          }}
        />
      )}
    </>
  );
}
