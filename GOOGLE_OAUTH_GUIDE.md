# Google OAuth Integration Guide

## 🎯 Features Implemented

### 1. **Sign In with Google Button**
- Located in Auth modal dialog
- Prominent Google branding with official colors
- Loading state when redirecting to Google
- Disabled state during authentication

### 2. **User Profile Display**
- **Desktop**: Full user menu dropdown with avatar, name, and email
- **Mobile**: Compact user card in mobile menu
- **Avatar**: Auto-generated with user initials and color-coded background
- **Support for Google profile pictures** (avatar URL from OAuth)

### 3. **User Menu Dropdown** (Desktop)
- User avatar (image or initials)
- User name and email
- "Open Chat" button
- "Settings" button (placeholder)
- "Sign Out" button

### 4. **Mobile User Card**
- User avatar with initials
- Name and email display
- "Open Chat" button
- "Sign Out" button

### 5. **Session Management**
- User profile stored in `localStorage`
- JWT token stored in `localStorage`
- Automatic session restoration on page reload
- Clean logout that clears all stored data

## 🔧 Configuration

### Frontend Environment Variables (`.env.local`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend Environment Variables (`.env`)
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📋 User Flow

### **Login Flow:**
1. User clicks "Sign In" button in navbar
2. Auth modal opens
3. User clicks "Continue with Google"
4. Loading state shows "Connecting to Google..."
5. Redirects to Google OAuth consent screen
6. User authorizes the app
7. Google redirects back with token and user info
8. Backend validates and creates/updates user
9. User is redirected to frontend with `?token=xxx&name=xxx&email=xxx`
10. Frontend stores token and user info in localStorage
11. User is automatically logged in

### **Session Restoration:**
1. User returns to the site
2. App checks localStorage for stored user
3. If found, user is automatically logged in
4. User profile appears in navbar

### **Logout Flow:**
1. User clicks "Sign Out" in user menu
2. Token and user info cleared from localStorage
3. User state updated to null
4. Navbar shows "Sign In" button again

## 🎨 UI Components

### **Files Created:**
- `src/components/UserMenu.tsx` - User profile dropdown component
- `src/data/.env.local` - Frontend environment variables

### **Files Modified:**
- `src/components/Auth.tsx` - Added Google OAuth button and loading states
- `src/App.tsx` - Integrated UserMenu, added login/logout logic

## 🔐 Security Features

1. **Token Storage**: JWT tokens stored in localStorage (can be upgraded to httpOnly cookies)
2. **Session Validation**: Token sent with every API request
3. **Automatic Cleanup**: Logout clears all sensitive data
4. **OAuth 2.0**: Industry-standard authentication flow
5. **HTTPS Required**: Google OAuth requires HTTPS in production

## 📱 Responsive Design

### **Desktop (≥768px)**
- User menu dropdown in navbar
- Shows avatar, name, email in dropdown
- Hover states and smooth animations

### **Mobile (<768px)**
- User card in mobile menu
- Larger touch targets
- Simplified layout

## 🎯 User Experience

### **Loading States**
- Google button shows spinner during redirect
- Clear "Connecting to Google..." message

### **Error Handling**
- Displays error messages in Auth modal
- Graceful fallback for failed OAuth

### **Avatar System**
- Uses Google profile picture if available
- Falls back to generated avatar with initials
- Color-coded based on user name
- 6 distinct color options (blue, purple, pink, indigo, green, orange)

## 🚀 Testing

### **To Test Google OAuth:**
1. Start backend server: `cd server && npm start`
2. Start frontend: `npm run dev`
3. Click "Sign In" in navbar
4. Click "Continue with Google"
5. Sign in with Google account
6. Verify you're redirected back and logged in
7. Check that user info appears in navbar

### **To Test Session Persistence:**
1. Log in with Google
2. Refresh the page
3. Verify you're still logged in
4. Check that user info persists

### **To Test Logout:**
1. Click on your avatar in navbar
2. Click "Sign Out"
3. Verify you're logged out
4. Check that "Sign In" button appears

## 📊 Data Structure

### **User Object (stored in localStorage):**
```typescript
{
  name: string;
  email: string;
  avatar?: string; // Optional Google profile picture URL
}
```

### **Token (stored in localStorage):**
```typescript
{
  token: string; // JWT token
}
```

## 🎨 Customization

### **To Change Avatar Colors:**
Edit the `getAvatarColor()` function in `UserMenu.tsx`:
```typescript
const colors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-green-500',
  'bg-orange-500'
];
```

### **To Add More Menu Items:**
Add buttons to the "Menu Items" section in `UserMenu.tsx`:
```tsx
<button className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left">
  <Icon className="w-5 h-5 text-gray-600" />
  <span className="text-sm font-medium text-gray-700">Menu Item</span>
</button>
```

## ✅ Checklist

- ✅ Google OAuth button in Auth modal
- ✅ User profile dropdown (desktop)
- ✅ User card (mobile)
- ✅ Avatar system (images + initials)
- ✅ Session management (localStorage)
- ✅ Automatic session restoration
- ✅ Logout functionality
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Smooth animations

## 🎉 Result

Users can now:
- Sign in with their Google account in one click
- See their profile information in the navbar
- Access chat functionality when logged in
- Sign out easily from the user menu
- Have their session persist across page reloads
- Enjoy a polished, professional authentication experience
