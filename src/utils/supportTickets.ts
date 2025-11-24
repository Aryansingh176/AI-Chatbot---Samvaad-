// Support Ticket Management Utilities

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type IssueType = 'technical' | 'billing' | 'account' | 'feature-request' | 'bug' | 'other';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  issueType: IssueType;
  description: string;
  email: string;
  priority: TicketPriority;
  status: TicketStatus;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  userName?: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  message: string;
  isStaff: boolean;
  createdAt: number;
  author: string;
}

const STORAGE_KEY = 'supportTickets';
const TICKET_COUNTER_KEY = 'ticketCounter';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Auth helpers
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Generate unique ticket number (local only)
export const generateTicketNumber = (): string => {
  let counter = parseInt(localStorage.getItem(TICKET_COUNTER_KEY) || '0', 10);
  counter += 1;
  localStorage.setItem(TICKET_COUNTER_KEY, counter.toString());
  return `TKT-${counter.toString().padStart(4, '0')}`;
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// localStorage helpers
const getAllTicketsLocal = (): SupportTicket[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
  return [];
};

const saveTicketsLocal = (tickets: SupportTicket[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error('Error saving tickets:', error);
  }
};

// Get all tickets (API-first)
export const getAllTickets = async (): Promise<SupportTicket[]> => {
  const token = getAuthToken();
  
  if (!token) {
    return getAllTicketsLocal();
  }

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tickets');
    }

    const data = await response.json();
    // Map API response to local format
    const tickets: SupportTicket[] = data.tickets.map((t: any) => ({
      id: t._id,
      ticketNumber: t.ticketNumber,
      issueType: t.issueType,
      description: t.description,
      email: t.email,
      priority: t.priority,
      status: t.status,
      imageUrl: t.imageUrl,
      createdAt: new Date(t.createdAt).getTime(),
      updatedAt: new Date(t.updatedAt).getTime(),
      userId: t.userId,
      userName: t.userName,
      responses: t.responses?.map((r: any) => ({
        id: r.id,
        message: r.message,
        isStaff: r.isStaff,
        createdAt: new Date(r.createdAt).getTime(),
        author: r.author,
      })) || [],
    }));

    // Save to localStorage as backup
    saveTicketsLocal(tickets);
    return tickets;
  } catch (error) {
    console.error('Failed to fetch tickets from API, using localStorage:', error);
    return getAllTicketsLocal();
  }
};

// Get tickets for specific user (API-first)
export const getUserTickets = async (userEmail: string): Promise<SupportTicket[]> => {
  const token = getAuthToken();
  
  if (!token) {
    const allTickets = getAllTicketsLocal();
    return allTickets.filter(ticket => ticket.email === userEmail);
  }

  try {
    const response = await fetch(`${API_URL}/tickets?email=${encodeURIComponent(userEmail)}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user tickets');
    }

    const data = await response.json();
    return data.tickets.map((t: any) => ({
      id: t._id,
      ticketNumber: t.ticketNumber,
      issueType: t.issueType,
      description: t.description,
      email: t.email,
      priority: t.priority,
      status: t.status,
      imageUrl: t.imageUrl,
      createdAt: new Date(t.createdAt).getTime(),
      updatedAt: new Date(t.updatedAt).getTime(),
      userId: t.userId,
      userName: t.userName,
      responses: t.responses?.map((r: any) => ({
        id: r.id,
        message: r.message,
        isStaff: r.isStaff,
        createdAt: new Date(r.createdAt).getTime(),
        author: r.author,
      })) || [],
    }));
  } catch (error) {
    console.error('Failed to fetch user tickets from API, using localStorage:', error);
    const allTickets = getAllTicketsLocal();
    return allTickets.filter(ticket => ticket.email === userEmail);
  }
};

// Save tickets (local only helper)
export const saveTickets = (tickets: SupportTicket[]): void => {
  saveTicketsLocal(tickets);
};

// Create new ticket (API-first)
export const createTicket = async (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt' | 'responses'>): Promise<SupportTicket> => {
  const token = getAuthToken();

  // If not authenticated, use localStorage
  if (!token) {
    const ticket: SupportTicket = {
      id: generateId(),
      ticketNumber: generateTicketNumber(),
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      responses: [],
      ...ticketData
    };

    const tickets = getAllTicketsLocal();
    tickets.unshift(ticket);
    saveTicketsLocal(tickets);

    return ticket;
  }

  // Try API first
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }

    const data = await response.json();
    const ticket: SupportTicket = {
      id: data.ticket._id,
      ticketNumber: data.ticket.ticketNumber,
      issueType: data.ticket.issueType,
      description: data.ticket.description,
      email: data.ticket.email,
      priority: data.ticket.priority,
      status: data.ticket.status,
      imageUrl: data.ticket.imageUrl,
      createdAt: new Date(data.ticket.createdAt).getTime(),
      updatedAt: new Date(data.ticket.updatedAt).getTime(),
      userId: data.ticket.userId,
      userName: data.ticket.userName,
      responses: [],
    };

    // Save to localStorage as backup
    const tickets = getAllTicketsLocal();
    tickets.unshift(ticket);
    saveTicketsLocal(tickets);

    return ticket;
  } catch (error) {
    console.error('Failed to create ticket via API, using localStorage:', error);
    const ticket: SupportTicket = {
      id: generateId(),
      ticketNumber: generateTicketNumber(),
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      responses: [],
      ...ticketData
    };

    const tickets = getAllTicketsLocal();
    tickets.unshift(ticket);
    saveTicketsLocal(tickets);

    return ticket;
  }
};

// Get ticket by ID
export const getTicket = async (id: string): Promise<SupportTicket | null> => {
  const tickets = await getAllTickets();
  return tickets.find(t => t.id === id) || null;
};

// Get ticket by ticket number (API-first)
export const getTicketByNumber = async (ticketNumber: string): Promise<SupportTicket | null> => {
  const token = getAuthToken();

  if (!token) {
    const tickets = getAllTicketsLocal();
    return tickets.find(t => t.ticketNumber === ticketNumber) || null;
  }

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketNumber}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ticket');
    }

    const data = await response.json();
    return {
      id: data.ticket._id,
      ticketNumber: data.ticket.ticketNumber,
      issueType: data.ticket.issueType,
      description: data.ticket.description,
      email: data.ticket.email,
      priority: data.ticket.priority,
      status: data.ticket.status,
      imageUrl: data.ticket.imageUrl,
      createdAt: new Date(data.ticket.createdAt).getTime(),
      updatedAt: new Date(data.ticket.updatedAt).getTime(),
      userId: data.ticket.userId,
      userName: data.ticket.userName,
      responses: data.ticket.responses?.map((r: any) => ({
        id: r.id,
        message: r.message,
        isStaff: r.isStaff,
        createdAt: new Date(r.createdAt).getTime(),
        author: r.author,
      })) || [],
    };
  } catch (error) {
    console.error('Failed to fetch ticket from API, using localStorage:', error);
    const tickets = getAllTicketsLocal();
    return tickets.find(t => t.ticketNumber === ticketNumber) || null;
  }
};

// Update ticket (API-first)
export const updateTicket = async (id: string, updates: Partial<SupportTicket>): Promise<void> => {
  const token = getAuthToken();

  // Update localStorage
  const tickets = getAllTicketsLocal();
  const index = tickets.findIndex(t => t.id === id);
  
  if (index !== -1) {
    tickets[index] = {
      ...tickets[index],
      ...updates,
      updatedAt: Date.now()
    };
    saveTicketsLocal(tickets);
  }

  // If authenticated, also update via API
  if (token && tickets[index]) {
    try {
      const ticketNumber = tickets[index].ticketNumber;
      await fetch(`${API_URL}/tickets/${ticketNumber}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update ticket via API:', error);
    }
  }
};

// Update ticket status (API-first)
export const updateTicketStatus = async (id: string, status: TicketStatus): Promise<void> => {
  const token = getAuthToken();

  // Get ticket first
  const tickets = getAllTicketsLocal();
  const ticket = tickets.find(t => t.id === id);
  
  if (!ticket) return;

  // Update localStorage
  await updateTicket(id, { status });

  // If authenticated, also update via API
  if (token) {
    try {
      await fetch(`${API_URL}/tickets/${ticket.ticketNumber}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Failed to update ticket status via API:', error);
    }
  }
};

// Add response to ticket (API-first)
export const addTicketResponse = async (ticketId: string, message: string, isStaff: boolean = false, author: string): Promise<void> => {
  const token = getAuthToken();
  const tickets = getAllTicketsLocal();
  const index = tickets.findIndex(t => t.id === ticketId);
  
  if (index === -1) return;

  const response: TicketResponse = {
    id: generateId(),
    message,
    isStaff,
    createdAt: Date.now(),
    author
  };

  // Update localStorage
  if (!tickets[index].responses) {
    tickets[index].responses = [];
  }
  
  tickets[index].responses!.push(response);
  tickets[index].updatedAt = Date.now();
  saveTicketsLocal(tickets);

  // If authenticated, also add via API
  if (token) {
    try {
      const ticketNumber = tickets[index].ticketNumber;
      await fetch(`${API_URL}/tickets/${ticketNumber}/responses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, isStaff, author }),
      });
    } catch (error) {
      console.error('Failed to add response via API:', error);
    }
  }
};

// Delete ticket
export const deleteTicket = async (id: string): Promise<void> => {
  const tickets = getAllTicketsLocal();
  const filtered = tickets.filter(t => t.id !== id);
  saveTicketsLocal(filtered);
};

// Get ticket statistics (API-first)
export const getTicketStats = async (userEmail?: string): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}> => {
  const token = getAuthToken();

  if (!token) {
    const tickets = userEmail ? await getUserTickets(userEmail) : getAllTicketsLocal();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };
  }

  try {
    const url = userEmail 
      ? `${API_URL}/tickets/admin/stats?email=${encodeURIComponent(userEmail)}`
      : `${API_URL}/tickets/admin/stats`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await response.json();
    return {
      total: data.stats.total,
      open: data.stats.open,
      inProgress: data.stats.inProgress,
      resolved: data.stats.resolved,
      closed: data.stats.closed,
    };
  } catch (error) {
    console.error('Failed to fetch ticket stats from API, using localStorage:', error);
    const tickets = userEmail ? await getUserTickets(userEmail) : getAllTicketsLocal();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };
  }
};

// Convert image to base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Get issue type label
export const getIssueTypeLabel = (type: IssueType): string => {
  const labels: Record<IssueType, string> = {
    'technical': 'Technical Issue',
    'billing': 'Billing',
    'account': 'Account',
    'feature-request': 'Feature Request',
    'bug': 'Bug Report',
    'other': 'Other'
  };
  return labels[type];
};

// Get priority label and color
export const getPriorityConfig = (priority: TicketPriority): { label: string; color: string; bg: string } => {
  const configs: Record<TicketPriority, { label: string; color: string; bg: string }> = {
    'low': { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
    'medium': { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
    'high': { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    'critical': { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
  };
  return configs[priority];
};

// Get status label and color
export const getStatusConfig = (status: TicketStatus): { label: string; color: string; bg: string } => {
  const configs: Record<TicketStatus, { label: string; color: string; bg: string }> = {
    'open': { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
    'in-progress': { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    'resolved': { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100' },
    'closed': { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-100' }
  };
  return configs[status];
};
