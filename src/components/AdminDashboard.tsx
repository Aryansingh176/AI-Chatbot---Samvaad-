import { useState, useEffect } from 'react';
import { X, BarChart3, MessageSquare, Ticket, Users, TrendingUp } from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onNavigate: (view: 'dashboard' | 'sessions') => void;
}

interface Metrics {
  totalChats?: number;
  agentSessions?: {
    total: number;
    active: number;
    resolved: number;
    waiting: number;
  };
  feedback?: {
    averageRating: number;
    totalFeedback: number;
    thumbsUpCount: number;
    thumbsDownCount: number;
  };
  languages?: { [key: string]: number };
  topIssues?: { name: string; count: number }[];
  ticketsOpen?: number;
}

export default function AdminDashboard({ onClose, onNavigate }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    console.log('[AdminDashboard] Mounting and fetching metrics...');
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    
    const fetchMetrics = async () => {
      try {
        if (!token) {
          throw new Error('Not authenticated. Please login again.');
        }

        // Fetch all metrics in parallel from existing endpoints
        const [agentSessionsRes, feedbackRes, ticketsRes] = await Promise.all([
          fetch('http://localhost:5000/api/agent-sessions/admin/stats', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('http://localhost:5000/api/feedback/stats', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('http://localhost:5000/api/tickets/admin/stats', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (!mounted) return;

        console.log('[AdminDashboard] Response statuses:', {
          agentSessions: agentSessionsRes.status,
          feedback: feedbackRes.status,
          tickets: ticketsRes.status,
        });

        // Check response status
        if (!agentSessionsRes.ok || !feedbackRes.ok || !ticketsRes.ok) {
          const failedEndpoint = !agentSessionsRes.ok 
            ? `agent sessions (${agentSessionsRes.status})` 
            : !feedbackRes.ok 
              ? `feedback (${feedbackRes.status})` 
              : `tickets (${ticketsRes.status})`;
          throw new Error(`Failed to fetch ${failedEndpoint} data`);
        }

        // Parse responses - check content type first
        const agentSessionsText = await agentSessionsRes.text();
        const feedbackText = await feedbackRes.text();
        const ticketsText = await ticketsRes.text();

        // Try to parse as JSON
        let agentSessionsData, feedbackData, ticketsData;
        try {
          agentSessionsData = JSON.parse(agentSessionsText);
          feedbackData = JSON.parse(feedbackText);
          ticketsData = JSON.parse(ticketsText);
        } catch (parseError) {
          console.error('[AdminDashboard] JSON parse error. Response was:', {
            agentSessions: agentSessionsText.substring(0, 100),
            feedback: feedbackText.substring(0, 100),
            tickets: ticketsText.substring(0, 100),
          });
          throw new Error('Server returned HTML instead of JSON. Check authentication or endpoint configuration.');
        }

        console.log('[AdminDashboard] Metrics loaded:', {
          agentSessions: agentSessionsData,
          feedback: feedbackData,
          tickets: ticketsData,
        });

        if (!mounted) return;

        // Combine metrics
        const combinedMetrics: Metrics = {
          agentSessions: {
            total: agentSessionsData.total || 0,
            active: agentSessionsData.active || 0,
            resolved: agentSessionsData.resolved || 0,
            waiting: agentSessionsData.waiting || 0,
          },
          feedback: {
            averageRating: feedbackData.averageRating || 0,
            totalFeedback: feedbackData.totalFeedback || 0,
            thumbsUpCount: feedbackData.thumbsUpCount || 0,
            thumbsDownCount: feedbackData.thumbsDownCount || 0,
          },
          ticketsOpen: ticketsData.open || 0,
          totalChats: agentSessionsData.total || 0,
          languages: {},
          topIssues: [],
        };

        setMetrics(combinedMetrics);
        setLoading(false);
      } catch (err: any) {
        console.error('[AdminDashboard] Error fetching metrics:', err);
        if (!mounted) return;
        
        if (err.message?.includes('Failed to fetch')) {
          setError('Network error. Check if backend is running on port 5000.');
        } else if (err.message) {
          setError(err.message);
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
        setLoading(false);
      }
    };

    fetchMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-lg text-gray-700">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Dashboard</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const agentStats = metrics?.agentSessions || { total: 0, active: 0, resolved: 0, waiting: 0 };
  const feedbackData = metrics?.feedback || { averageRating: 0, totalFeedback: 0, thumbsUpCount: 0, thumbsDownCount: 0 };
  const totalChats = metrics?.totalChats || 0;
  const ticketsOpen = metrics?.ticketsOpen || 0;
  const languages = metrics?.languages || {};
  const topIssues = metrics?.topIssues || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
            <p className="text-indigo-200 text-sm">Analytics & Management</p>
          </div>

          <nav className="space-y-2 flex-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('[AdminDashboard] Dashboard clicked');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('[AdminDashboard] Agent Sessions clicked');
                onNavigate('sessions');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Agent Sessions</span>
            </button>
            <button 
              onClick={(e) => e.preventDefault()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all opacity-50 cursor-not-allowed"
            >
              <Ticket className="w-5 h-5" />
              <span className="font-medium">Support Tickets</span>
            </button>
            <button 
              onClick={(e) => e.preventDefault()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all opacity-50 cursor-not-allowed"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">User Management</span>
            </button>
          </nav>

          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('[AdminDashboard] Close clicked');
              onClose();
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
            <span>Close</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to your analytics overview</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('[AdminDashboard] Header close clicked');
                onClose();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h3>
                <p className="text-gray-600">Real-time analytics and insights</p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-indigo-600">{agentStats.total}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-indigo-300" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-600">{agentStats.resolved}</div>
                      <div className="text-sm text-gray-600 mt-1">Resolved</div>
                    </div>
                    <MessageSquare className="w-8 h-8 text-green-300" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-yellow-600">{agentStats.active}</div>
                      <div className="text-sm text-gray-600 mt-1">Active</div>
                    </div>
                    <Users className="w-8 h-8 text-yellow-300" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-orange-600">
                        {feedbackData.averageRating > 0 ? feedbackData.averageRating.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Avg Rating</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-300" />
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Feedback Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Feedback</span>
                      <span className="font-semibold text-gray-900">{feedbackData.totalFeedback}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">👍 Positive</span>
                      <span className="font-semibold text-green-600">{feedbackData.thumbsUpCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">👎 Negative</span>
                      <span className="font-semibold text-red-600">{feedbackData.thumbsDownCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Chat Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Chats</span>
                      <span className="font-semibold text-gray-900">{totalChats}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Waiting</span>
                      <span className="font-semibold text-yellow-600">{agentStats.waiting}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Open Tickets</span>
                      <span className="font-semibold text-red-600">{ticketsOpen}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {Object.keys(languages).length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(languages).map(([lang, count]) => (
                      <div key={lang} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-indigo-600">{count}</div>
                        <div className="text-sm text-gray-600 mt-1">{lang}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Issues */}
              {topIssues.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h4>
                  <div className="space-y-3">
                    {topIssues.map((issue, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{issue.name}</span>
                        <span className="font-semibold text-indigo-600">{issue.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
