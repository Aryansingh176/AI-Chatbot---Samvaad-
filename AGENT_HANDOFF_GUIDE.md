# Human-Agent Chat Handoff System

## Overview
This feature allows users to escalate their chatbot conversations to human agents after experiencing failed AI responses. Admins can manage these escalated chats in real-time through a dedicated Admin Panel.

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER CHATBOT                             │
│                                                                 │
│  User Message 1  →  AI Fails  →  Counter = 1                   │
│  User Message 2  →  AI Fails  →  Counter = 2                   │
│                                                                 │
│  ┌───────────────────────────────────────────┐                 │
│  │  🟢 Talk to Human Agent (Button Appears)  │                 │
│  └───────────────────────────────────────────┘                 │
│                         ↓                                       │
│         "Connecting to agent..." message                       │
│                         ↓                                       │
│              Session Created in localStorage                   │
│                   Status: WAITING                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                       ADMIN PANEL                               │
│                                                                 │
│  📊 Statistics: [Waiting: 1] [Active: 0] [Resolved: 0]         │
│                                                                 │
│  Session List:                                                  │
│  ┌──────────────────────────────────────┐                      │
│  │ 🟡 John Doe (waiting)                │ ← Click to open      │
│  │    "I need help"                     │                      │
│  └──────────────────────────────────────┘                      │
│                         ↓                                       │
│              Click "Accept Chat" Button                         │
│                   Status: ACTIVE                                │
│                         ↓                                       │
│         Admin types and sends message                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME POLLING                            │
│                                                                 │
│  User's ChatBot  ←──[localStorage]──→  Admin Panel              │
│    (polls every 2s)                    (polls every 2s)         │
│                                                                 │
│  New message from agent appears instantly in user's chat!       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RESOLUTION                                 │
│                                                                 │
│  Admin clicks "Mark Resolved" → Status: RESOLVED               │
│  Session moves to resolved list                                 │
│  User can continue or close chat                                │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### User Side (ChatBot)
- **Automatic Failure Tracking**: The system tracks failed AI responses
- **Manual Escalation**: After 2 failed responses, a "Talk to Human Agent" button appears
- **Real-time Communication**: Uses localStorage polling for live updates
- **Session Persistence**: All messages are saved and retrievable

### Admin Side (Admin Panel)
- **Session Dashboard**: View all user support requests
- **Real-time Updates**: Automatically refreshes every 3 seconds
- **Status Management**: Track sessions through states (waiting → active → resolved)
- **Live Chat Interface**: Respond to users in real-time
- **Search & Filter**: Find specific sessions by user or status
- **Statistics**: Overview of all session states

## How It Works

### 1. User Initiates Handoff
When the chatbot fails to provide satisfactory responses twice:
```
User sends message → AI fails → Counter: 1
User sends message → AI fails → Counter: 2
→ "Talk to Human Agent" button appears
```

### 2. Session Creation
When user clicks the button:
- A new session is created with a unique ID (`SESSION-timestamp-random`)
- User's context (name, email, last message) is saved
- Session status is set to "waiting"
- ChatBot switches to "agent mode"

### 3. Admin Response
Admin can:
- See the session in "Waiting" filter
- Click "Accept Chat" to change status to "active"
- Send real-time responses
- Mark as "resolved" when complete

### 4. Real-time Polling
Both user and admin poll localStorage every 2-3 seconds for new messages:
```typescript
pollingRef.current.start(sessionId, (newMessages) => {
  // Display new messages
});
```

## File Structure

```
src/
├── utils/
│   └── agentHandoff.ts         # Core session management utilities
└── components/
    ├── ChatBot.tsx             # Updated with agent handoff
    └── AdminPanel.tsx          # Admin interface for managing sessions
```

## API Reference

### agentHandoff.ts

#### `createAgentSession(userEmail, userName, initialMessage, failedAttempts)`
Creates a new support session
- Returns: `AgentSession` object

#### `addMessageToSession(sessionId, text, sender)`
Adds a message to an existing session
- `sender`: 'user' | 'bot' | 'agent'
- Returns: `AgentMessage` object

#### `updateSessionStatus(sessionId, status, assignedAgent?)`
Updates session status
- `status`: 'waiting' | 'active' | 'resolved'

#### `getSession(sessionId)`
Retrieves a specific session

#### `getSessionsByStatus(status)`
Filters sessions by status

#### `SessionPolling`
Class for real-time updates:
```typescript
const polling = new SessionPolling();
polling.start(sessionId, (newMessages) => { /* ... */ });
polling.stop();
```

## Storage Keys

- `agentSessions`: Array of all agent sessions
- Each session includes:
  - `id`: Unique session identifier
  - `userEmail`: User's email
  - `userName`: User's name
  - `status`: Current session state
  - `messages[]`: Array of message objects
  - `createdAt`: Timestamp
  - `updatedAt`: Last activity timestamp
  - `failedAttempts`: Number of AI failures
  - `assignedAgent?`: Name of assigned agent

## Usage

### Opening Admin Panel
```typescript
// In App.tsx
<button onClick={() => setShowAdminPanel(true)}>
  Admin
</button>
```

### Testing the Flow
1. **Create Failed Responses**:
   - Send messages that the AI can't handle
   - Or temporarily disable the AI endpoint
   - After 2 failures, button appears

2. **Escalate to Agent**:
   - Click "Talk to Human Agent"
   - System creates session
   - User sees "Connecting to agent..." message

3. **Respond as Admin**:
   - Open Admin Panel (purple "Admin" button in navbar)
   - See the waiting session
   - Click "Accept Chat"
   - Type and send response
   - User receives it in real-time

## Styling

### ChatBot Agent Button
- Green gradient (from-green-600 to-emerald-600)
- UserCog icon
- Appears only after 2+ failures
- Hidden when in agent mode

### Admin Panel
- Purple/indigo gradient theme
- Statistics cards at top
- Split view: Session list + Chat area
- Color-coded status badges:
  - Yellow: Waiting
  - Blue: Active
  - Green: Resolved

## Future Enhancements

Potential improvements:
- WebSocket support for true real-time (replace polling)
- Email notifications to admins for new sessions
- Chat history export
- Multiple agent assignment
- Priority queue for waiting sessions
- Typing indicators
- File/image sharing in agent chat
- Session transfer between agents
- Canned responses for common queries

## Limitations

Current limitations:
- Uses localStorage (single-device only)
- Polling has 2-3 second delay
- No persistence across browser sessions
- Admin must be logged in to same app
- No push notifications

For production use, consider implementing:
- Backend API with WebSocket
- Database persistence
- Multi-admin support
- Mobile app support
