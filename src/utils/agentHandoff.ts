// Agent Handoff Utility - Manages human agent chat sessions

export type MessageSender = 'user' | 'bot' | 'agent';

export interface AgentMessage {
  id: string;
  sessionId: string;
  text: string;
  sender: MessageSender;
  timestamp: number;
}

export interface AgentSession {
  id: string;
  userEmail: string;
  userName: string;
  status: 'waiting' | 'active' | 'resolved';
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
  failedAttempts?: number;
  assignedAgent?: string;
}

const STORAGE_KEY = 'agentSessions';
const POLLING_INTERVAL = 2000; // 2 seconds
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

// Generate unique session ID
export const generateSessionId = (): string => {
  return `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate unique message ID
const generateMessageId = (): string => {
  return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// localStorage helpers
const getAllSessionsLocal = (): AgentSession[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveSessionsLocal = (sessions: AgentSession[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

// Get all sessions (API-first with localStorage fallback)
export const getAllSessions = async (): Promise<AgentSession[]> => {
  const token = getAuthToken();
  
  if (!token) {
    return getAllSessionsLocal();
  }

  try {
    const response = await fetch(`${API_URL}/agent-sessions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    const data = await response.json();
    // Map API response to local format
    const sessions: AgentSession[] = data.sessions.map((s: any) => ({
      id: s.sessionId,
      userEmail: s.userEmail,
      userName: s.userName,
      status: s.status,
      messages: s.messages.map((m: any) => ({
        id: m.id,
        sessionId: s.sessionId,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(m.timestamp).getTime(),
      })),
      createdAt: new Date(s.createdAt).getTime(),
      updatedAt: new Date(s.updatedAt).getTime(),
      failedAttempts: s.failedAttempts,
      assignedAgent: s.assignedAgent,
    }));

    // Save to localStorage as backup
    saveSessionsLocal(sessions);
    return sessions;
  } catch (error) {
    console.error('Failed to fetch sessions from API, using localStorage:', error);
    return getAllSessionsLocal();
  }
};

// Get sessions by status
export const getSessionsByStatus = async (status: AgentSession['status']): Promise<AgentSession[]> => {
  const sessions = await getAllSessions();
  return sessions.filter(session => session.status === status);
};

// Get session by ID (API-first)
export const getSession = async (sessionId: string): Promise<AgentSession | null> => {
  const token = getAuthToken();
  
  if (!token) {
    const sessions = getAllSessionsLocal();
    return sessions.find(s => s.id === sessionId) || null;
  }

  try {
    const response = await fetch(`${API_URL}/agent-sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }

    const data = await response.json();
    const session: AgentSession = {
      id: data.session.sessionId,
      userEmail: data.session.userEmail,
      userName: data.session.userName,
      status: data.session.status,
      messages: data.session.messages.map((m: any) => ({
        id: m.id,
        sessionId: data.session.sessionId,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(m.timestamp).getTime(),
      })),
      createdAt: new Date(data.session.createdAt).getTime(),
      updatedAt: new Date(data.session.updatedAt).getTime(),
      failedAttempts: data.session.failedAttempts,
      assignedAgent: data.session.assignedAgent,
    };

    return session;
  } catch (error) {
    console.error('Failed to fetch session from API, using localStorage:', error);
    const sessions = getAllSessionsLocal();
    return sessions.find(s => s.id === sessionId) || null;
  }
};

// Create new agent session (API-first)
export const createAgentSession = async (
  userEmail: string,
  userName: string,
  initialMessage: string,
  failedAttempts: number = 0
): Promise<AgentSession> => {
  const token = getAuthToken();
  
  // If not authenticated, use localStorage
  if (!token) {
    const sessions = getAllSessionsLocal();
    const sessionId = generateSessionId();
    
    const newSession: AgentSession = {
      id: sessionId,
      userEmail,
      userName,
      status: 'waiting',
      messages: [
        {
          id: generateMessageId(),
          sessionId,
          text: initialMessage,
          sender: 'user',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      failedAttempts,
    };

    sessions.push(newSession);
    saveSessionsLocal(sessions);
    return newSession;
  }

  // Try API first
  try {
    const response = await fetch(`${API_URL}/agent-sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userEmail,
        userName,
        initialMessage,
        failedAttempts,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    const newSession: AgentSession = {
      id: data.session.sessionId,
      userEmail: data.session.userEmail,
      userName: data.session.userName,
      status: data.session.status,
      messages: data.session.messages.map((m: any) => ({
        id: m.id,
        sessionId: data.session.sessionId,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(m.timestamp).getTime(),
      })),
      createdAt: new Date(data.session.createdAt).getTime(),
      updatedAt: new Date(data.session.updatedAt).getTime(),
      failedAttempts: data.session.failedAttempts,
    };

    // Save to localStorage as backup
    const sessions = getAllSessionsLocal();
    sessions.push(newSession);
    saveSessionsLocal(sessions);

    return newSession;
  } catch (error) {
    console.error('Failed to create session via API, using localStorage:', error);
    const sessions = getAllSessionsLocal();
    const sessionId = generateSessionId();
    
    const newSession: AgentSession = {
      id: sessionId,
      userEmail,
      userName,
      status: 'waiting',
      messages: [
        {
          id: generateMessageId(),
          sessionId,
          text: initialMessage,
          sender: 'user',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      failedAttempts,
    };

    sessions.push(newSession);
    saveSessionsLocal(sessions);
    return newSession;
  }
};

// Add message to session (API-first)
export const addMessageToSession = async (
  sessionId: string,
  text: string,
  sender: MessageSender
): Promise<AgentMessage | null> => {
  const token = getAuthToken();
  
  // If not authenticated, use localStorage
  if (!token) {
    const sessions = getAllSessionsLocal();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return null;

    const message: AgentMessage = {
      id: generateMessageId(),
      sessionId,
      text,
      sender,
      timestamp: Date.now(),
    };

    sessions[sessionIndex].messages.push(message);
    sessions[sessionIndex].updatedAt = Date.now();
    
    saveSessionsLocal(sessions);
    
    return message;
  }

  // Try API first
  try {
    const response = await fetch(`${API_URL}/agent-sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, sender }),
    });

    if (!response.ok) {
      throw new Error('Failed to add message');
    }

    const data = await response.json();
    const message: AgentMessage = {
      id: data.message.id,
      sessionId,
      text: data.message.text,
      sender: data.message.sender,
      timestamp: new Date(data.message.timestamp).getTime(),
    };

    // Update localStorage
    const sessions = getAllSessionsLocal();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].messages.push(message);
      sessions[sessionIndex].updatedAt = Date.now();
      saveSessionsLocal(sessions);
    }

    return message;
  } catch (error) {
    console.error('Failed to add message via API, using localStorage:', error);
    const sessions = getAllSessionsLocal();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return null;

    const message: AgentMessage = {
      id: generateMessageId(),
      sessionId,
      text,
      sender,
      timestamp: Date.now(),
    };

    sessions[sessionIndex].messages.push(message);
    sessions[sessionIndex].updatedAt = Date.now();
    
    saveSessionsLocal(sessions);
    
    return message;
  }
};

// Update session status (API-first)
export const updateSessionStatus = async (
  sessionId: string,
  status: AgentSession['status'],
  assignedAgent?: string
): Promise<boolean> => {
  const token = getAuthToken();
  
  // If not authenticated, use localStorage
  if (!token) {
    const sessions = getAllSessionsLocal();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return false;

    sessions[sessionIndex].status = status;
    sessions[sessionIndex].updatedAt = Date.now();
    
    if (assignedAgent) {
      sessions[sessionIndex].assignedAgent = assignedAgent;
    }
    
    saveSessionsLocal(sessions);
    
    return true;
  }

  // Try API first
  try {
    const response = await fetch(`${API_URL}/agent-sessions/${sessionId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, assignedAgent }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    // Update localStorage
    const sessions = getAllSessionsLocal();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].status = status;
      sessions[sessionIndex].updatedAt = Date.now();
      if (assignedAgent) {
        sessions[sessionIndex].assignedAgent = assignedAgent;
      }
      saveSessionsLocal(sessions);
    }

    return true;
  } catch (error) {
    console.error('Failed to update status via API, using localStorage:', error);
    const sessions = getAllSessionsLocal();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return false;

    sessions[sessionIndex].status = status;
    sessions[sessionIndex].updatedAt = Date.now();
    
    if (assignedAgent) {
      sessions[sessionIndex].assignedAgent = assignedAgent;
    }
    
    saveSessionsLocal(sessions);
    
    return true;
  }
};

// Get new messages since timestamp (for polling)
export const getNewMessages = async (sessionId: string, sinceTimestamp: number): Promise<AgentMessage[]> => {
  const session = await getSession(sessionId);
  if (!session) return [];
  
  return session.messages.filter(msg => msg.timestamp > sinceTimestamp);
};

// Delete session (API-first)
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const token = getAuthToken();
  
  // Always try to delete from localStorage first
  const sessions = getAllSessionsLocal();
  const filteredSessions = sessions.filter(s => s.id !== sessionId);
  
  if (filteredSessions.length === sessions.length) {
    // Session not found in localStorage
    if (!token) return false;
  } else {
    // Save updated localStorage
    saveSessionsLocal(filteredSessions);
  }

  // If authenticated, also delete from API
  if (token) {
    try {
      const response = await fetch(`${API_URL}/agent-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to delete session from API');
      }
    } catch (error) {
      console.error('Error deleting session from API:', error);
    }
  }
  
  return true;
};

// Get session statistics (API-first)
export const getSessionStats = async () => {
  const token = getAuthToken();
  
  if (!token) {
    const sessions = getAllSessionsLocal();
    return {
      waiting: sessions.filter(s => s.status === 'waiting').length,
      active: sessions.filter(s => s.status === 'active').length,
      resolved: sessions.filter(s => s.status === 'resolved').length,
      total: sessions.length,
    };
  }

  try {
    const response = await fetch(`${API_URL}/agent-sessions/admin/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('Failed to fetch stats from API, using localStorage:', error);
    const sessions = getAllSessionsLocal();
    return {
      waiting: sessions.filter(s => s.status === 'waiting').length,
      active: sessions.filter(s => s.status === 'active').length,
      resolved: sessions.filter(s => s.status === 'resolved').length,
      total: sessions.length,
    };
  }
};

// Polling helper for real-time updates
export class SessionPolling {
  private intervalId: number | null = null;
  private lastTimestamp: number = Date.now();
  
  start(sessionId: string, onNewMessage: (messages: AgentMessage[]) => void) {
    this.stop(); // Clear any existing interval
    
    this.intervalId = window.setInterval(async () => {
      const newMessages = await getNewMessages(sessionId, this.lastTimestamp);
      if (newMessages.length > 0) {
        this.lastTimestamp = Date.now();
        onNewMessage(newMessages);
      }
    }, POLLING_INTERVAL);
  }
  
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
