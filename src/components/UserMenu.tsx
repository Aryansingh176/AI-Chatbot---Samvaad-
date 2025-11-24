import { useState, useRef, useEffect } from 'react';
import { LogOut, MessageSquare, User, ChevronDown, History, Ticket } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

interface UserMenuProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenHistory?: () => void;
  onCreateTicket?: () => void;
  onViewTickets?: () => void;
  onOpenProfile?: () => void;
}

export default function UserMenu({ user, onLogout, onOpenChat, onOpenHistory, onCreateTicket, onViewTickets, onOpenProfile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-green-500',
      'bg-orange-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
            {getInitials(user.name)}
          </div>
        )}
        <div className="hidden lg:block text-left">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
          <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
        </div>
        <ChevronDown className={`hidden lg:block w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                onOpenChat();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-blue-50 transition-colors text-left"
            >
              <MessageSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700">Open Chat</span>
            </button>

            {onOpenHistory && (
              <button
                onClick={() => {
                  onOpenHistory();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-purple-50 transition-colors text-left"
              >
                <History className="w-5 h-5 text-purple-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">Chat History</span>
              </button>
            )}

            {onViewTickets && (
              <button
                onClick={() => {
                  onViewTickets();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-orange-50 transition-colors text-left"
              >
                <Ticket className="w-5 h-5 text-orange-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">My Tickets</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-green-50 transition-colors text-left"
              >
                <User className="w-5 h-5 text-green-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">My Profile</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-red-600" aria-hidden="true" />
              <span className="text-sm font-medium text-red-600">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
