import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  User,
  Truck,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  X
} from 'lucide-react';
import knowledgeBaseData from '../data/knowledgeBase.json';
import { getCurrentLanguage, onLanguageChange } from '../utils/languageManager';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  language: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const iconMap: { [key: string]: any } = {
  ShoppingBag,
  CreditCard,
  RefreshCw,
  User,
  Truck,
  MessageCircle
};

const colorMap: { [key: string]: { bg: string; text: string; border: string; hover: string } } = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', hover: 'hover:bg-pink-100' }
};

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories: Category[] = knowledgeBaseData.categories;
  const faqs: FAQ[] = knowledgeBaseData.faqs;

  // Listen for global language changes
  useEffect(() => {
    const cleanup = onLanguageChange((newLang) => {
      setSelectedLanguage(newLang);
    });
    return cleanup;
  }, []);

  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'mr', name: 'मराठी' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'zh', name: '中文' }
  ];

  // Filter FAQs based on search, category, and language
  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = searchQuery === '' || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || faq.category === selectedCategory;
      const matchesLanguage = faq.language === selectedLanguage;
      
      return matchesSearch && matchesCategory && matchesLanguage;
    });
  }, [faqs, searchQuery, selectedCategory, selectedLanguage]);

  // Get FAQ count per category for current language
  const getCategoryCount = (categoryId: string) => {
    return faqs.filter(faq => faq.category === categoryId && faq.language === selectedLanguage).length;
  };

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <section id="knowledge-base" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Knowledge Base
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions and learn more about our services
          </p>
        </div>

        {/* Language Selector - Hidden since using global */}
        <div className="hidden flex-wrap justify-center gap-2 mb-8">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLanguage(lang.code as any);
                setExpandedFAQ(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                selectedLanguage === lang.code
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
              aria-label={`Switch to ${lang.name}`}
            >
              {lang.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-150 text-base shadow-sm"
              aria-label="Search knowledge base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              Found {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" aria-hidden="true" />
              Browse by Category
            </h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                aria-label="Clear category filter"
              >
                <X className="w-4 h-4" />
                Clear Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => {
              const Icon = iconMap[category.icon];
              const colors = colorMap[category.color];
              const count = getCategoryCount(category.id);
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(isActive ? null : category.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    isActive
                      ? `${colors.bg} ${colors.border} shadow-md scale-[1.02]`
                      : `bg-white border-gray-200 ${colors.hover} hover:border-gray-300 hover:shadow-sm`
                  }`}
                  aria-label={`Filter by ${category.name}`}
                  aria-pressed={isActive}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} aria-hidden="true" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                  <p className="text-xs text-gray-500">{count} {count === 1 ? 'article' : 'articles'}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {selectedCategory && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium text-blue-900">
                  Showing {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'} in{' '}
                  <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Show All
              </button>
            </div>
          )}

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or browse by category
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => {
                const isExpanded = expandedFAQ === faq.id;
                const category = categories.find(c => c.id === faq.category);
                const colors = category ? colorMap[category.color] : colorMap.blue;

                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-md animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-6 py-5 flex items-start justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={isExpanded}
                      aria-controls={`faq-answer-${faq.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                            {category?.name}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 leading-snug">
                          {faq.question}
                        </h4>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-blue-600" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" aria-hidden="true" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        id={`faq-answer-${faq.id}`}
                        className="px-6 pb-5 animate-fade-in"
                        role="region"
                        aria-label="Answer"
                      >
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Footer */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-blue-50 to-violet-50 rounded-2xl border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Can't find what you're looking for?
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Our support team is here to help you 24/7
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-150 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              Contact Support
            </a>
            <button
              onClick={() => {
                const chatButton = document.querySelector('[aria-label="Open chat window"]') as HTMLButtonElement;
                if (chatButton) chatButton.click();
              }}
              className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-150"
            >
              Start Live Chat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KnowledgeBase;
