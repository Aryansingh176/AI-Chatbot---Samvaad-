import { useState } from 'react';
import { Mail, Lock, User, X, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function Auth({ onClose, onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleGoogleLogin = () => {
    // Show loading state
    setGoogleLoading(true);
    setError('');
    
    // Redirect to Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');

      setTimeout(() => {
        onClose();
        // Trigger success callback to refresh user state
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      console.error('[Auth] Login/Signup error:', errorMsg, 'API URL:', import.meta.env.VITE_API_URL);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full relative animate-fade-in max-h-[90vh] overflow-y-auto pr-2">
        <button
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {isLogin ? (
                <LogIn className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin
                ? 'Sign in to access your account'
                : 'Sign up to get started with SAMVAAD AI'}
            </p>
          </div>

          {error && (
            <div id="auth-error" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm" role="alert">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm" role="status">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200" style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                  <div className="flex items-center justify-center w-9 flex-shrink-0" aria-hidden="true">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder=""
                    required={!isLogin}
                    aria-label="Full name"
                    className="flex-1 py-3.5 pr-4 text-base border-0 rounded-r-xl outline-none bg-transparent"
                    style={{ boxSizing: 'border-box', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200" style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                <div className="flex items-center justify-center w-9 flex-shrink-0" aria-hidden="true">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=""
                  required
                  aria-label="Email address"
                  aria-describedby={error ? 'auth-error' : undefined}
                  className="flex-1 py-3.5 pr-4 text-base border-0 rounded-r-xl outline-none bg-transparent"
                  style={{ boxSizing: 'border-box', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200" style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                <div className="flex items-center justify-center w-9 flex-shrink-0" aria-hidden="true">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=""
                  required
                  minLength={6}
                  aria-label="Password"
                  aria-describedby="password-hint"
                  className="flex-1 py-3.5 pr-4 text-base border-0 rounded-r-xl outline-none bg-transparent"
                  style={{ boxSizing: 'border-box', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                />
              </div>
              <p id="password-hint" className="mt-1.5 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label={isLogin ? 'Sign in to your account' : 'Create new account'}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-base rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            aria-label="Sign in with Google"
            className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 bg-white shadow-sm hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-gray-600 hover:text-blue-600 transition-all duration-150"
            >
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="font-semibold text-blue-600">Sign Up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="font-semibold text-blue-600">Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
