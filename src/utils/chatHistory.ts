// Chat History Management Utilities

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'chatConversations';
const CURRENT_CONVERSATION_KEY = 'currentConversationId';

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate conversation title from first message
export const generateTitle = (firstMessage: string): string => {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength) + '...';
};

// Get all conversations
export const getAllConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return [];
};

// Save conversations
export const saveConversations = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
};

// Get current conversation ID
export const getCurrentConversationId = (): string | null => {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
};

// Set current conversation ID
export const setCurrentConversationId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(CURRENT_CONVERSATION_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
  }
};

// Create new conversation
export const createConversation = (firstMessage: Message): Conversation => {
  const conversation: Conversation = {
    id: generateId(),
    title: generateTitle(firstMessage.text),
    messages: [firstMessage],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const conversations = getAllConversations();
  conversations.unshift(conversation); // Add to beginning
  saveConversations(conversations);
  setCurrentConversationId(conversation.id);

  return conversation;
};

// Add message to conversation
export const addMessageToConversation = (
  conversationId: string,
  message: Message
): void => {
  const conversations = getAllConversations();
  const index = conversations.findIndex(c => c.id === conversationId);

  if (index !== -1) {
    conversations[index].messages.push(message);
    conversations[index].updatedAt = Date.now();
    
    // Move to top
    const [updated] = conversations.splice(index, 1);
    conversations.unshift(updated);
    
    saveConversations(conversations);
  }
};

// Get conversation by ID
export const getConversation = (id: string): Conversation | null => {
  const conversations = getAllConversations();
  return conversations.find(c => c.id === id) || null;
};

// Delete conversation
export const deleteConversation = (id: string): void => {
  const conversations = getAllConversations();
  const filtered = conversations.filter(c => c.id !== id);
  saveConversations(filtered);
  
  if (getCurrentConversationId() === id) {
    setCurrentConversationId(null);
  }
};

// Update conversation
export const updateConversation = (conversation: Conversation): void => {
  const conversations = getAllConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  
  if (index !== -1) {
    conversation.updatedAt = Date.now();
    conversations[index] = conversation;
    saveConversations(conversations);
  }
};

// Start new conversation (clear current)
export const startNewConversation = (): void => {
  setCurrentConversationId(null);
};

// Save message pair (user + bot)
export const saveMessagePair = (userText: string, botText: string): void => {
  const currentId = getCurrentConversationId();
  
  const userMessage: Message = {
    id: generateId(),
    text: userText,
    isUser: true,
    timestamp: Date.now()
  };
  
  const botMessage: Message = {
    id: generateId(),
    text: botText,
    isUser: false,
    timestamp: Date.now()
  };

  if (currentId) {
    // Add to existing conversation
    addMessageToConversation(currentId, userMessage);
    addMessageToConversation(currentId, botMessage);
  } else {
    // Create new conversation
    const conversation = createConversation(userMessage);
    addMessageToConversation(conversation.id, botMessage);
  }
};
