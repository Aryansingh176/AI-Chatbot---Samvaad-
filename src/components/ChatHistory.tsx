import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Clock, Search, X, Calendar } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatHistoryProps {
  onClose: () => void;
  onLoadConversation: (conversation: Conversation) => void;
}

export default function ChatHistory({ onClose, onLoadConversation }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const stored = localStorage.getItem('chatConversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Sort by most recent first
        const sorted = parsed.sort((a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt);
        setConversations(sorted);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      }
    }
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(conv => conv.id !== id);
    setConversations(updated);
    localStorage.setItem('chatConversations', JSON.stringify(updated));
    if (selectedConversation === id) {
      setSelectedConversation(null);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
      setConversations([]);
      localStorage.removeItem('chatConversations');
      setSelectedConversation(null);
    }
  };

  const handleLoadConversation = (conversation: Conversation) => {
    onLoadConversation(conversation);
    onClose();
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get preview text from conversation
  const getPreviewText = (messages: Message[]) => {
    if (messages.length === 0) return 'No messages';
    const lastMessage = messages[messages.length - 1];
    return lastMessage.text.slice(0, 100) + (lastMessage.text.length > 100 ? '...' : '');
  };

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const date = formatDate(conv.updatedAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chat History</h2>
              <p className="text-sm text-gray-500">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close chat history"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                aria-label="Search conversations"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {conversations.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-all text-sm flex items-center gap-2 whitespace-nowrap"
                aria-label="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-gray-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No conversations found' : 'No chat history yet'}
              </h3>
              <p className="text-gray-600 max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start a conversation with the chatbot and it will appear here'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConversations).map(([date, convs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2 z-10">
                    <Calendar className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{date}</h3>
                  </div>
                  <div className="space-y-3">
                    {convs.map((conversation, index) => (
                      <div
                        key={conversation.id}
                        className={`card bg-white border-2 transition-all duration-200 cursor-pointer animate-fade-in ${
                          selectedConversation === conversation.id
                            ? 'border-blue-500 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 text-lg truncate">
                                {conversation.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {formatTime(conversation.updatedAt)}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {getPreviewText(conversation.messages)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded font-medium">
                                {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadConversation(conversation);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm flex items-center justify-center gap-2"
                            aria-label={`Load conversation: ${conversation.title}`}
                          >
                            <MessageSquare className="w-4 h-4" aria-hidden="true" />
                            Load Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this conversation?')) {
                                deleteConversation(conversation.id);
                              }
                            }}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-all text-sm flex items-center gap-2"
                            aria-label={`Delete conversation: ${conversation.title}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
