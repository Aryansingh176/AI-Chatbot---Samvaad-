import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Globe,
  Zap,
  Brain,
  Github,
  Linkedin,
  Mail,
  Menu,
  X,
  ArrowRight,
  Code,
  Database,
  Cpu,
  Network,
  Check,
  LogIn,
  History,
  Ticket,
  ShieldCheck
} from 'lucide-react';
import Auth from './components/Auth';
import ChatBot from './components/ChatBot';
import KnowledgeBase from './components/KnowledgeBase';
import UserMenu from './components/UserMenu';
import UserProfile from './components/UserProfile';
import ChatHistory from './components/ChatHistory';
import CreateTicket from './components/CreateTicket';
import MyTickets from './components/MyTickets';
import AdminPanel from './components/AdminPanel';
import AdminDashboard from './components/AdminDashboard';
import LanguageSwitcher from './components/LanguageSwitcher';
import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isTyping, setIsTyping] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [adminView, setAdminView] = useState<'dashboard' | 'sessions'>('dashboard');
  const [chatInitialLanguage, setChatInitialLanguage] = useState<string | undefined>(undefined);
  const [chatStandalone, setChatStandalone] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; picture?: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loadedConversation, setLoadedConversation] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Handle Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    const picture = params.get('picture');
    
    if (token && name && email) {
      // Store the token and user info
      localStorage.setItem('token', token);
      const userData = { name, email, ...(picture && { picture }) };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // If the page is opened with ?openChat=1&lang=xx then open chatbot in standalone mode
    if (params.get('openChat') === '1') {
      const lang = params.get('lang') || undefined;
      setChatInitialLanguage(lang || undefined);
      setChatStandalone(true);
      setShowChatBot(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  // If opened in standalone mode (from a new tab), render ONLY the chatbot
  if (chatStandalone) {
    return (
      <ChatBot
        onClose={() => {
          setChatStandalone(false);
          setChatInitialLanguage(undefined);
          window.close();
        }}
        initialLanguage={chatInitialLanguage}
        autoGreet={true}
        standalone={true}
        loadedConversation={loadedConversation}
      />
    );
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-lg' 
          : 'bg-white/90 backdrop-blur-md shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo - Reduced size and left-aligned */}
            <a href="#home" className="flex items-center gap-2 flex-shrink-0" aria-label="SAMVAAD AI Home">
              <MessageSquare className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <span className="text-lg font-bold gradient-text">SAMVAAD AI</span>
            </a>

            {/* Desktop Navigation - Centered with equal spacing */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center gap-2">
                {['Home', 'About', 'Technology', 'Demo', 'Insights', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    aria-label={`Navigate to ${item} section`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      activeSection === item.toLowerCase() 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Actions - Prominent primary CTA, minimal secondary */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setAdminView('dashboard');
                      setShowAdminPanel(true);
                    }}
                    aria-label="Open admin dashboard"
                    className="px-3 py-2 border border-purple-300 text-purple-600 text-sm font-medium rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    Admin
                  </button>
                  <UserMenu 
                    user={user} 
                    onLogout={handleLogout} 
                    onOpenChat={() => setShowChatBot(true)}
                    onOpenHistory={() => setShowChatHistory(true)}
                    onViewTickets={() => setShowMyTickets(true)}
                    onOpenProfile={() => setShowUserProfile(true)}
                  />
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  aria-label="Sign in to your account"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Hamburger - Show at <= 900px */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md border-t shadow-lg">
            <nav className="px-4 py-4 space-y-2" aria-label="Mobile navigation">
              {/* Language Switcher in Mobile */}
              <div className="px-4 py-2 border-b border-gray-200 pb-4 mb-2">
                <LanguageSwitcher />
              </div>
              
              {['Home', 'About', 'Technology', 'Demo', 'Insights', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  aria-label={`Navigate to ${item} section`}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                >
                  {item}
                </button>
              ))}
              {user ? (
                <>
                  <div className="px-4 py-3 mt-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowChatBot(true);
                        setIsMenuOpen(false);
                      }}
                      aria-label="Open chat window"
                      className="btn-ripple w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-160 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset mb-2"
                    >
                      Open Chat
                    </button>
                    <button
                      onClick={() => {
                        setShowChatHistory(true);
                        setIsMenuOpen(false);
                      }}
                      aria-label="View chat history"
                      className="w-full px-4 py-2.5 bg-white border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-160 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset mb-2 flex items-center justify-center gap-2"
                    >
                      <History className="w-5 h-5" aria-hidden="true" />
                      Chat History
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      aria-label="Sign out"
                      className="w-full px-4 py-2.5 bg-white border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all duration-160 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setIsMenuOpen(false);
                  }}
                  aria-label="Sign in to your account"
                  className="w-full px-4 py-3 mt-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-160 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  Sign In
                </button>
              )}
            </nav>
          </div>
        )}
      </nav>

      <main id="main-content">
      <section id="home" className="pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-10 bg-gradient-to-br from-blue-50 via-white to-violet-50 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
                <span className="gradient-text">SAMVAAD AI</span>
              </h1>
              <div className="h-20 mb-8">
                <p className="text-xl sm:text-2xl text-gray-700 animate-slide-up">
                  {isTyping ? (
                    <span className="border-r-2 border-blue-600 pr-1 animate-pulse">
                      Breaking language barriers...
                    </span>
                  ) : (
                    "Breaking language barriers with intelligent multilingual customer support."
                  )}
                </p>
              </div>
              <p className="text-lg text-gray-600 mb-8">
                Empowering customer communication beyond language barriers using advanced AI and Natural Language Processing.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => scrollToSection('demo')}
                  aria-label="Try the chatbot demo"
                  className="btn-ripple px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition-all duration-150 transform hover:scale-[1.02] flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <span>Try the Chatbot</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  aria-label="Learn more about SAMVAAD AI"
                  className="btn-ripple px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Learn More
                </button>
              </div>
            </div>

            <div className="hidden md:block animate-float">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-violet-400 rounded-full blur-3xl opacity-30"></div>
                <div className="relative bg-white rounded-lg shadow-lg p-8 border border-gray-100">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm text-gray-700">Hello! How can I help you today?</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="flex-1">
                        <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg p-3 ml-12">
                          <p className="text-sm text-white">मुझे अपने ऑर्डर के बारे में जानकारी चाहिए</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm text-gray-700">I'd be happy to help you with your order information!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              About <span className="gradient-text">SAMVAAD AI</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SAMVAAD AI is an intelligent multilingual chatbot designed to revolutionize customer support by breaking down language barriers and providing context-aware assistance.
            </p>
          </div>

          <div className="feature-grid mb-16">
            {[
              {
                icon: Globe,
                title: 'Multilingual Understanding',
                description: 'Supports multiple languages with accurate translation and context preservation'
              },
              {
                icon: Brain,
                title: 'Natural Language Processing',
                description: 'Advanced NLP algorithms to understand intent and sentiment'
              },
              {
                icon: Zap,
                title: 'Smart Response System',
                description: 'Intelligent responses powered by state-of-the-art AI models'
              },
              {
                icon: Network,
                title: 'Easy Integration',
                description: 'Seamlessly integrates with existing customer support platforms'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="feature-card hover-scale fade-up bg-gradient-to-br from-blue-50 to-violet-50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">{feature.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg shadow-lg p-10 sm:p-12 text-white">
            <div className="max-w-3xl">
              <h3 className="text-3xl font-bold mb-4">Why SAMVAAD AI?</h3>
              <p className="text-lg text-blue-50 mb-6">
                In today's globalized world, businesses serve customers who speak different languages.
                SAMVAAD AI eliminates the communication gap by providing real-time, accurate, and context-aware
                multilingual support, ensuring every customer feels heard and understood.
              </p>
              <ul className="space-y-3">
                {[
                  'Reduces response time by understanding queries in any language',
                  'Improves customer satisfaction with accurate translations',
                  'Scales support operations without language constraints',
                  'Leverages cutting-edge AI and NLP technologies'
                ].map((point, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="technology" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Technology <span className="gradient-text">Stack</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge technologies and industry-standard frameworks
            </p>
          </div>

          <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {[
              { name: 'Python', category: 'Backend', icon: Code, color: 'from-blue-500 to-blue-600' },
              { name: 'Flask / Node.js', category: 'Framework', icon: Database, color: 'from-green-500 to-green-600' },
              { name: 'LangChain', category: 'AI Framework', icon: Brain, color: 'from-violet-500 to-violet-600' },
              { name: 'Hugging Face', category: 'Transformers', icon: Cpu, color: 'from-orange-500 to-orange-600' },
              { name: 'HTML/CSS/JS', category: 'Frontend', icon: Code, color: 'from-pink-500 to-pink-600' },
              { name: 'NLP Libraries', category: 'Processing', icon: Network, color: 'from-cyan-500 to-cyan-600' }
            ].map((tech, index) => (
              <div
                key={index}
                className="feature-card hover-scale fade-up bg-white border border-gray-100 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-10 h-10 bg-gradient-to-r ${tech.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-150`}>
                    <tech.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{tech.name}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{tech.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white rounded-lg p-10 shadow-md border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Architecture Overview</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Frontend Layer',
                  items: ['User Interface', 'Chat Widget', 'Response Display']
                },
                {
                  title: 'Processing Layer',
                  items: ['Language Detection', 'NLP Processing', 'Intent Recognition']
                },
                {
                  title: 'Backend Layer',
                  items: ['AI Models', 'Translation Engine', 'Response Generation']
                }
              ].map((layer, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg p-8 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{layer.title}</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {layer.items.map((item, i) => (
                        <li key={i} className="flex items-center justify-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Live <span className="gradient-text">Demo</span>
            </h2>
            <p className="text-xl text-gray-600">
              Experience SAMVAAD AI in action
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-10 border-2 border-dashed border-gray-300">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6 text-white" />
                  <span className="text-white font-semibold">SAMVAAD AI Chat</span>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                </div>
              </div>

              <div className="p-8 h-96 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Try SAMVAAD AI Chatbot</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Click on any language below to start chatting in that language. The AI will respond
                  in your chosen language in real-time!
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {[
                    { name: 'English', code: 'en' },
                    { name: 'हिंदी', code: 'hi' },
                    { name: 'Español', code: 'es' },
                    { name: 'Français', code: 'fr' },
                    { name: '中文', code: 'zh' },
                    { name: 'العربية', code: 'ar' }
                  ].map((langObj, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        // open chat in a new tab - clean URL with just the query params
                        const url = new URL(window.location.origin);
                        url.searchParams.set('openChat', '1');
                        url.searchParams.set('lang', langObj.code);
                        window.open(url.toString(), '_blank');
                      }}
                      className="btn-ripple px-4 py-2.5 min-h-[44px] bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 shadow-sm hover:shadow-md transition-all duration-150"
                    >
                      {langObj.name}
                    </button>
                  ))}
                </div>
                {user ? (
                  <button
                    onClick={() => setShowChatBot(true)}
                    className="btn-ripple px-6 sm:px-8 py-3.5 min-h-[48px] bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition-all duration-150 transform hover:scale-[1.02]"
                  >
                    Open Chat
                  </button>
                ) : (
                  <div>
                    <button
                      onClick={() => setShowAuth(true)}
                      className="btn-ripple px-6 sm:px-8 py-3.5 min-h-[48px] bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition-all duration-150 transform hover:scale-[1.02]"
                    >
                      Login to Chat
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                      You need to be logged in to use the chatbot
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center text-gray-600">
              <p className="text-sm">
                Powered by intelligent multilingual AI with MongoDB for conversation history
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Base Section */}
      <KnowledgeBase />

      <section id="insights" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-gradient-to-br from-blue-50 via-white to-violet-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Project <span className="gradient-text">Insights</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deep dive into the development and vision of SAMVAAD AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="fade-up hover-scale bg-white rounded-lg p-10 shadow-md hover:shadow-lg transition-all duration-150" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Problem Statement</h3>
              <p className="text-gray-600 leading-relaxed">
                Traditional customer support systems struggle with language barriers, leading to poor customer
                experience and increased resolution times. Many customers abandon queries due to language
                limitations, resulting in lost business opportunities and decreased satisfaction.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Objectives</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Create an AI-powered multilingual chatbot</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Implement context-aware response generation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Support real-time language translation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Ensure scalable and efficient architecture</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg p-10 shadow-md mb-12">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Implementation Overview</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Core Components</h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Language detection module</li>
                  <li>• NLP preprocessing pipeline</li>
                  <li>• Intent classification system</li>
                  <li>• Response generation engine</li>
                  <li>• Translation and localization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Multi-language support (10+ languages)</li>
                  <li>• Context-aware conversations</li>
                  <li>• Sentiment analysis</li>
                  <li>• Real-time response generation</li>
                  <li>• User feedback integration</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg shadow-lg p-10 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔮</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Future Scope</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-blue-50">
              <div>
                <p className="font-medium text-white mb-2">Short-term Goals</p>
                <ul className="space-y-1 text-sm">
                  <li>• Expand to 20+ languages</li>
                  <li>• Voice input/output support</li>
                  <li>• Enhanced emotion detection</li>
                  <li>• Mobile app development</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-white mb-2">Long-term Vision</p>
                <ul className="space-y-1 text-sm">
                  <li>• Integration with CRM systems</li>
                  <li>• Advanced analytics dashboard</li>
                  <li>• Custom model fine-tuning</li>
                  <li>• Enterprise deployment options</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Login / <span className="gradient-text">Sign Up</span>
            </h2>
            <p className="text-xl text-gray-600">
              Access your account or create a new one to get started!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
            <div className="fade-up hover-scale bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg p-10 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Connect With Us</h3>
              <div className="space-y-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <Github className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                  <div>
                    <p className="font-semibold text-gray-900">GitHub</p>
                    <p className="text-sm text-gray-600">View source code</p>
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/in/aryan-singh-bab101250?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <Linkedin className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                  <div>
                    <p className="font-semibold text-gray-900">LinkedIn</p>
                    <p className="text-sm text-gray-600">Connect professionally</p>
                  </div>
                </a>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg">
                  <Mail className="w-6 h-6 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">samvaad.ai@example.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="fade-up hover-scale bg-white rounded-lg p-10 shadow-md border-2 border-gray-200 hover:border-blue-600 transition-all duration-150" style={{ animationDelay: '100ms' }}>
              {user ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h3>
                  <p className="text-gray-600 mb-1">{user.name}</p>
                  <p className="text-sm text-gray-500 mb-6">{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="btn-ripple px-6 sm:px-8 py-3.5 min-h-[48px] bg-red-600 text-white rounded-lg font-semibold shadow-md hover:bg-red-700 hover:shadow-lg transition-all duration-150"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h3>
                  <p className="text-gray-600 mb-6">
                    Create an account or sign in to access all features of SAMVAAD AI
                  </p>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="btn-ripple w-full px-6 py-3.5 min-h-[48px] bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition-all duration-150 transform hover:scale-[1.02]"
                  >
                    Login / Sign Up
                  </button>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Secure access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Quick setup</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Free to use</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Save progress</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg p-10 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Project Team</h3>
            <p className="text-gray-600 mb-2">Final Year Computer Science Engineering Project</p>
            <p className="text-gray-600">
              Developed with passion by the SAMVAAD AI Team
            </p>
          </div>

          {/* Support Ticket CTA */}
          {user && (
            <div className="mt-8 text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 border-2 border-orange-200">
              <Ticket className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Submit a support ticket and our team will get back to you as soon as possible
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setShowCreateTicket(true)}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  Create Support Ticket
                </button>
                <button
                  onClick={() => setShowMyTickets(true)}
                  className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all flex items-center gap-2"
                >
                  View My Tickets
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">SAMVAAD AI</span>
              </div>
              <p className="text-gray-400">
                Breaking language barriers with intelligent multilingual customer support.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {['Home', 'About', 'Technology', 'Demo', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="block text-gray-400 hover:text-white transition-all duration-150"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  Documentation
                </a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  GitHub Repository
                </a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  Project Report
                </a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  API Reference
                </a>
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="block text-gray-400 hover:text-white transition-colors text-left"
                >
                  Privacy & Security
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 sm:mb-0">
              © 2025 SAMVAAD AI – Multilingual Chatbot Project. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="Visit our GitHub" className="text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded">
                <Github className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="https://www.linkedin.com/in/aryan-singh-bab101250?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" aria-label="Connect on LinkedIn" className="text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded">
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="mailto:samvaad.ai@example.com" aria-label="Send us an email" className="text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      </main>

      {showAuth && (
        <Auth
          onClose={() => {
            setShowAuth(false);
          }}
          onSuccess={refreshUser}
        />
      )}
      
      {showChatHistory && (
        <ChatHistory
          onClose={() => setShowChatHistory(false)}
          onLoadConversation={(conversation) => {
            setLoadedConversation(conversation);
            setShowChatBot(true);
          }}
        />
      )}
      
      {showChatBot && (
        <ChatBot
          onClose={() => {
            setShowChatBot(false);
            setChatInitialLanguage(undefined);
            setChatStandalone(false);
            setLoadedConversation(null);
            // clean query params in standalone mode
            const params = new URLSearchParams(window.location.search);
            if (params.get('openChat') === '1') {
              params.delete('openChat');
              params.delete('lang');
              const base = window.location.origin + window.location.pathname;
              const qs = params.toString();
              const newUrl = qs ? `${base}?${qs}` : base;
              window.history.replaceState({}, '', newUrl);
            }
          }}
          initialLanguage={chatInitialLanguage}
          autoGreet={true}
          standalone={chatStandalone}
          loadedConversation={loadedConversation}
        />
      )}

      {showCreateTicket && user && (
        <CreateTicket
          onClose={() => setShowCreateTicket(false)}
          onSuccess={(ticketNumber) => {
            setShowCreateTicket(false);
            setShowMyTickets(true);
          }}
          userEmail={user.email}
          userName={user.name}
        />
      )}

      {showMyTickets && user && (
        <MyTickets
          onClose={() => setShowMyTickets(false)}
          onCreateTicket={() => {
            setShowMyTickets(false);
            setShowCreateTicket(true);
          }}
          userEmail={user.email}
        />
      )}

      {showAdminPanel && user && (
        adminView === 'dashboard' ? (
          <AdminDashboard 
            onClose={() => setShowAdminPanel(false)}
            onNavigate={(view) => setAdminView(view)}
          />
        ) : (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )
      )}

      {showUserProfile && user && (
        <UserProfile
          onClose={() => setShowUserProfile(false)}
          user={user}
          onLogout={() => {
            handleLogout();
            setShowUserProfile(false);
          }}
        />
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </div>
  );
}

export default App;
