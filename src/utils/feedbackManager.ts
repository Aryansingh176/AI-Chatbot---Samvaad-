export interface Feedback {
  id: string;
  sessionId?: string;
  rating: number; // 1-5 stars
  thumbs?: 'up' | 'down';
  comment?: string;
  userEmail?: string;
  userName?: string;
  timestamp: number;
  chatContext?: {
    messageCount: number;
    topics: string[];
    duration: number; // in seconds
  };
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  thumbsUpCount: number;
  thumbsDownCount: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentFeedback: Feedback[];
  trendData: {
    date: string;
    averageRating: number;
    count: number;
  }[];
}

const STORAGE_KEY = 'chatFeedback';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Generate unique feedback ID
export function generateFeedbackId(): string {
  return `FEEDBACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save feedback to MongoDB via API
export async function saveFeedback(feedback: Omit<Feedback, 'id' | 'timestamp'>): Promise<Feedback> {
  const token = getAuthToken();
  
  // Fallback to localStorage if not authenticated
  if (!token) {
    return saveFeedbackLocal(feedback);
  }

  try {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedback)
    });

    if (!response.ok) {
      throw new Error('Failed to save feedback to server');
    }

    const data = await response.json();
    
    // Also save to localStorage as backup
    const newFeedback: Feedback = {
      ...feedback,
      id: data.feedback.id,
      timestamp: new Date(data.feedback.createdAt).getTime(),
    };
    saveFeedbackLocal(newFeedback);
    
    return newFeedback;
  } catch (error) {
    console.error('Error saving feedback to API, falling back to localStorage:', error);
    return saveFeedbackLocal(feedback);
  }
}

// Local storage fallback
function saveFeedbackLocal(feedback: Omit<Feedback, 'id' | 'timestamp'> | Feedback): Feedback {
  const newFeedback: Feedback = 'id' in feedback ? feedback : {
    ...feedback,
    id: generateFeedbackId(),
    timestamp: Date.now(),
  };

  const allFeedback = getAllFeedbackLocal();
  allFeedback.push(newFeedback);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allFeedback));

  return newFeedback;
}

// Get all feedback from API
export async function getAllFeedback(): Promise<Feedback[]> {
  const token = getAuthToken();
  
  if (!token) {
    return getAllFeedbackLocal();
  }

  try {
    const response = await fetch(`${API_URL}/feedback`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feedback from server');
    }

    const data = await response.json();
    return data.feedback.map((f: any) => ({
      id: f.feedbackId,
      sessionId: f.sessionId,
      rating: f.rating,
      thumbs: f.thumbs,
      comment: f.comment,
      userEmail: f.userEmail,
      userName: f.userName,
      timestamp: new Date(f.createdAt).getTime(),
      chatContext: f.chatContext
    }));
  } catch (error) {
    console.error('Error fetching feedback from API, using localStorage:', error);
    return getAllFeedbackLocal();
  }
}

// Local storage version
function getAllFeedbackLocal(): Feedback[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return [];
  }
}

// Get feedback by session ID
export async function getFeedbackBySession(sessionId: string): Promise<Feedback | null> {
  const allFeedback = await getAllFeedback();
  return allFeedback.find(f => f.sessionId === sessionId) || null;
}

// Get feedback statistics
export async function getFeedbackStats(daysBack: number = 30): Promise<FeedbackStats> {
  const token = getAuthToken();
  
  // Try to get stats from API
  if (token) {
    try {
      const response = await fetch(`${API_URL}/feedback/stats?days=${daysBack}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching stats from API, calculating locally:', error);
    }
  }

  // Fallback to local calculation
  const allFeedback = await getAllFeedback();
  const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
  const recentFeedback = allFeedback.filter(f => f.timestamp >= cutoffTime);

  // Calculate average rating
  const totalRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0);
  const averageRating = recentFeedback.length > 0 ? totalRating / recentFeedback.length : 0;

  // Count thumbs
  const thumbsUpCount = recentFeedback.filter(f => f.thumbs === 'up').length;
  const thumbsDownCount = recentFeedback.filter(f => f.thumbs === 'down').length;

  // Rating distribution
  const ratingDistribution = {
    1: recentFeedback.filter(f => f.rating === 1).length,
    2: recentFeedback.filter(f => f.rating === 2).length,
    3: recentFeedback.filter(f => f.rating === 3).length,
    4: recentFeedback.filter(f => f.rating === 4).length,
    5: recentFeedback.filter(f => f.rating === 5).length,
  };

  // Trend data - last 7 days
  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = Date.now() - (i * 24 * 60 * 60 * 1000);
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);
    
    const dayFeedback = allFeedback.filter(f => 
      f.timestamp >= dayStart && f.timestamp < dayEnd
    );
    
    const dayAverage = dayFeedback.length > 0
      ? dayFeedback.reduce((sum, f) => sum + f.rating, 0) / dayFeedback.length
      : 0;
    
    const date = new Date(dayStart);
    trendData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      averageRating: Math.round(dayAverage * 10) / 10,
      count: dayFeedback.length,
    });
  }

  return {
    totalFeedback: recentFeedback.length,
    averageRating: Math.round(averageRating * 10) / 10,
    thumbsUpCount,
    thumbsDownCount,
    ratingDistribution,
    recentFeedback: recentFeedback.slice(-10).reverse(), // Last 10, most recent first
    trendData,
  };
}

// Delete feedback (admin function)
export async function deleteFeedback(feedbackId: string): Promise<boolean> {
  const token = getAuthToken();
  
  if (token) {
    try {
      const response = await fetch(`${API_URL}/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Also delete from localStorage
        const allFeedback = await getAllFeedback();
        const filtered = allFeedback.filter(f => f.id !== feedbackId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
      }
    } catch (error) {
      console.error('Error deleting feedback from API:', error);
    }
  }

  // Fallback to localStorage
  try {
    const allFeedback = await getAllFeedback();
    const filtered = allFeedback.filter(f => f.id !== feedbackId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
}

// Clear all feedback (admin function)
export function clearAllFeedback(): void {
  localStorage.removeItem(STORAGE_KEY);
}
