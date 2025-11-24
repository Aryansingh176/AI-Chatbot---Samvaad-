import { useState, useEffect } from 'react';
import { 
  Ticket, 
  Search, 
  X, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Loader,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getUserTickets, 
  getTicketStats,
  updateTicketStatus,
  SupportTicket,
  TicketStatus,
  getIssueTypeLabel,
  getPriorityConfig,
  getStatusConfig
} from '../utils/supportTickets';

interface MyTicketsProps {
  onClose: () => void;
  onCreateTicket: () => void;
  userEmail: string;
}

export default function MyTickets({ onClose, onCreateTicket, userEmail }: MyTicketsProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });

  useEffect(() => {
    loadTickets();
  }, [userEmail]);

  const loadTickets = async () => {
    const userTickets = await getUserTickets(userEmail);
    setTickets(userTickets);
    
    try {
      const ticketStats = await getTicketStats(userEmail);
      setStats(ticketStats);
    } catch (error) {
      console.error('Failed to load ticket stats:', error);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await updateTicketStatus(ticketId, newStatus);
    loadTickets();
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getIssueTypeLabel(ticket.issueType).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const toggleTicket = (id: string) => {
    setExpandedTicket(expandedTicket === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Support Tickets</h2>
              <p className="text-sm text-gray-500">{stats.total} ticket{stats.total !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Close my tickets"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Open</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Loader className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Resolved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Closed</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'all')}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                onClick={onCreateTicket}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Ticket className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No tickets found' : 'No tickets yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first support ticket to get help'
                }
              </p>
              <button
                onClick={onCreateTicket}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => {
                const isExpanded = expandedTicket === ticket.id;
                const priorityConfig = getPriorityConfig(ticket.priority);
                const statusConfig = getStatusConfig(ticket.status);

                return (
                  <div
                    key={ticket.id}
                    className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => toggleTicket(ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{ticket.ticketNumber}</h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
                              {priorityConfig.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            {getIssueTypeLabel(ticket.issueType)}
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                          aria-label={isExpanded ? 'Collapse ticket' : 'Expand ticket'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created: {formatDate(ticket.createdAt)}
                        </div>
                        {ticket.imageUrl && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Has attachment
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4 animate-fade-in">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Description</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                              {ticket.description}
                            </p>
                          </div>

                          {ticket.imageUrl && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Attachment</h4>
                              <img
                                src={ticket.imageUrl}
                                alt="Ticket attachment"
                                className="w-full max-w-md h-auto rounded-lg border-2 border-gray-200"
                              />
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Ticket Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-gray-600 font-medium">Email:</span>
                                <p className="text-gray-900">{ticket.email}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-gray-600 font-medium">Last Updated:</span>
                                <p className="text-gray-900">{formatDate(ticket.updatedAt)}</p>
                              </div>
                            </div>
                          </div>

                          {ticket.status !== 'closed' && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h4>
                              <div className="flex gap-2">
                                {ticket.status !== 'resolved' && (
                                  <button
                                    onClick={() => handleStatusChange(ticket.id, 'resolved')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                                  >
                                    Mark as Resolved
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusChange(ticket.id, 'closed')}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
                                >
                                  Close Ticket
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
