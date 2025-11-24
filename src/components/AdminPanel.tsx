import { useState, useEffect, useRef } from 'react';
import { X, UserCog, Clock, CheckCircle, AlertCircle, Send, Search, Users } from 'lucide-react';
import {
  getAllSessions,
  getSessionsByStatus,
  getSession,
  addMessageToSession,
  updateSessionStatus,
  getSessionStats,
  type AgentSession,
  SessionPolling
} from '../utils/agentHandoff';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AgentSession | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | AgentSession['status']>('all');
  const [messageInput, setMessageInput] = useState('');
  const [stats, setStats] = useState({ waiting: 0, active: 0, resolved: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<SessionPolling | null>(null);

  // Load sessions
  const loadSessions = async () => {
    const allSessions = filterStatus === 'all' 
      ? await getAllSessions() 
      : await getSessionsByStatus(filterStatus);
    
    // Sort by updatedAt (most recent first)
    allSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    
    // Filter by search query
    const filtered = searchQuery
      ? allSessions.filter(s => 
          s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : allSessions;
    
    setSessions(filtered);
    
    // Load stats
    try {
      const sessionStats = await getSessionStats();
      if (sessionStats) {
        setStats(sessionStats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({ waiting: 0, active: 0, resolved: 0, total: 0 });
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Refresh every 3 seconds
    const interval = setInterval(loadSessions, 3000);
    
    return () => clearInterval(interval);
  }, [filterStatus, searchQuery]);

  // Start polling when session is selected
  useEffect(() => {
    if (selectedSession) {
      if (!pollingRef.current) {
        pollingRef.current = new SessionPolling();
      }
      
      pollingRef.current.start(selectedSession.id, async () => {
        // Reload the selected session
        const updated = await getSession(selectedSession.id);
        if (updated) {
          setSelectedSession(updated);
        }
      });
    }
    
    return () => {
      if (pollingRef.current) {
        pollingRef.current.stop();
      }
    };
  }, [selectedSession?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSession) return;

    await addMessageToSession(selectedSession.id, messageInput.trim(), 'agent');
    
    // Update local state
    const updatedSession = await getSession(selectedSession.id);
    if (updatedSession) {
      setSelectedSession(updatedSession);
    }
    
    setMessageInput('');
    loadSessions();
  };

  const handleStatusChange = async (status: AgentSession['status']) => {
    if (!selectedSession) return;
    
    const user = localStorage.getItem('user');
    const agentName = user ? JSON.parse(user).name : 'Admin';
    
    await updateSessionStatus(selectedSession.id, status, agentName);
    
    const updatedSession = await getSession(selectedSession.id);
    if (updatedSession) {
      setSelectedSession(updatedSession);
    }
    
    loadSessions();
  };

  const getStatusColor = (status: AgentSession['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: AgentSession['status']) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'active': return <AlertCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <UserCog className="w-7 h-7 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl">Admin Panel</h2>
              <p className="text-purple-100 text-sm">Manage user support requests</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Statistics */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 shadow-sm border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-700 font-medium">Waiting</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.waiting}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Active</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.active}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-medium">Resolved</p>
                  <p className="text-2xl font-bold text-green-900">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Session List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'all' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('waiting')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'waiting' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Waiting
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'active' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'resolved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                  <Users className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm text-center">No sessions found</p>
                </div>
              ) : (
                sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full p-4 border-b border-gray-200 text-left hover:bg-gray-50 transition-colors ${
                      selectedSession?.id === session.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{session.userName}</p>
                        <p className="text-xs text-gray-500 truncate">{session.userEmail}</p>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                      {session.messages[session.messages.length - 1]?.text || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}</span>
                      <span>{new Date(session.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedSession ? (
            <div className="flex-1 flex flex-col">
              {/* Session Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{selectedSession.userName}</h3>
                    <p className="text-sm text-gray-600">{selectedSession.userEmail}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 ${getStatusColor(selectedSession.status)}`}>
                    {getStatusIcon(selectedSession.status)}
                    {selectedSession.status}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {selectedSession.status === 'waiting' && (
                    <button
                      onClick={() => handleStatusChange('active')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Accept Chat
                    </button>
                  )}
                  {selectedSession.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange('resolved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {selectedSession.assignedAgent && (
                    <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                      Assigned to: <span className="font-medium">{selectedSession.assignedAgent}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {selectedSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-xl shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-br-sm'
                          : message.sender === 'agent'
                          ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-bl-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm mb-1">{message.text}</p>
                      <p className={`text-xs ${message.sender === 'user' || message.sender === 'agent' ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString()} · {message.sender === 'user' ? 'User' : message.sender === 'agent' ? 'Agent' : 'Bot'}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedSession.status !== 'resolved' && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your response..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                    >
                      <Send className="w-5 h-5" />
                      Send
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <UserCog className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a session to start chatting</p>
                <p className="text-sm mt-1">Choose from the list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
