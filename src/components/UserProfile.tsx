import { useState, useEffect } from 'react';
import { X, Mail, Globe, MessageSquare, Ticket, LogOut, Check, Settings } from 'lucide-react';
import { getCurrentLanguage, setLanguage } from '../utils/languageManager';
import { getAllConversations } from '../utils/chatHistory';
import { getUserTickets } from '../utils/supportTickets';

interface UserProfileProps {
  onClose: () => void;
  user: {
    name: string;
    email: string;
    picture?: string;
  };
  onLogout: () => void;
}

type SupportedLanguage = 'en' | 'hi' | 'bn' | 'mr' | 'es' | 'fr' | 'zh' | 'ar' | 'pt' | 'de' | 'ja' | 'ru';

const LANGUAGES = {
  en: { name: 'English', native: 'English' },
  hi: { name: 'Hindi', native: 'हिंदी' },
  bn: { name: 'Bengali', native: 'বাংলা' },
  mr: { name: 'Marathi', native: 'मराठी' },
  es: { name: 'Spanish', native: 'Español' },
  fr: { name: 'French', native: 'Français' },
  zh: { name: 'Chinese', native: '中文' },
  ar: { name: 'Arabic', native: 'العربية' },
  pt: { name: 'Portuguese', native: 'Português' },
  de: { name: 'German', native: 'Deutsch' },
  ja: { name: 'Japanese', native: '日本語' },
  ru: { name: 'Russian', native: 'Русский' }
};

export default function UserProfile({ onClose, user, onLogout }: UserProfileProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(getCurrentLanguage());
  const [chatCount, setChatCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [languageSaved, setLanguageSaved] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, [user.email]);

  const loadUserStats = async () => {
    try {
      // Get chat history count
      const conversations = getAllConversations();
      setChatCount(conversations.length);

      // Get ticket count
      const tickets = await getUserTickets(user.email);
      setTicketCount(tickets.length);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    setLanguage(lang as any);
    setLanguageSaved(true);
    setTimeout(() => setLanguageSaved(false), 2000);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">{getInitials(user.name)}</span>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
              <div className="flex items-center gap-2 text-white/90">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-blue-700">{chatCount}</span>
            </div>
            <p className="text-sm font-medium text-blue-800">Chat Conversations</p>
            <p className="text-xs text-blue-600 mt-1">Total saved chats</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-purple-700">{ticketCount}</span>
            </div>
            <p className="text-sm font-medium text-purple-800">Support Tickets</p>
            <p className="text-xs text-purple-600 mt-1">Created tickets</p>
          </div>
        </div>

        {/* Language Preference Section */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-800">Language Preference</h2>
              </div>
              {languageSaved && (
                <div className="flex items-center gap-1 text-green-600 text-sm animate-fade-in">
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Choose your preferred language for the chatbot and interface
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className={`px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    selectedLanguage === code
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{lang.native}</div>
                  <div className={`text-xs mt-0.5 ${
                    selectedLanguage === code ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {lang.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-800">Account Settings</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Account Type</p>
                  <p className="text-sm text-gray-600">Google Account</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Connected
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Profile Picture</p>
                  <p className="text-sm text-gray-600">Synced from Google</p>
                </div>
                {user.picture && (
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onLogout}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer Info */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            Your data is securely stored and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
