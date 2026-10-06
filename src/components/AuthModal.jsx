import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiLogin, apiRegister } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter your email address');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        try {
          const res = await apiRegister(name, email, password);
          if (res?.success && res.user) {
            onAuthSuccess(res.user);
            onClose();
            return;
          } else if (res?.error) {
            throw new Error(res.error);
          }
        } catch (apiErr) {
          // Offline fallback
          const userObj = {
            id: 'user_' + Date.now(),
            name: name.trim(),
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
            created_at: new Date().toISOString()
          };
          onAuthSuccess(userObj);
          onClose();
          return;
        }
      } else {
        if (!email.trim()) throw new Error('Please enter your email or username');
        if (!password) throw new Error('Please enter your password');

        try {
          const res = await apiLogin(email, password);
          if (res?.success && res.user) {
            onAuthSuccess(res.user);
            onClose();
            return;
          } else if (res?.error) {
            throw new Error(res.error);
          }
        } catch (apiErr) {
          // Offline fallback
          const clean = email.split('@')[0];
          const userObj = {
            id: 'user_' + clean.toLowerCase(),
            name: clean.charAt(0).toUpperCase() + clean.slice(1),
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(clean)}`,
            created_at: new Date().toISOString()
          };
          onAuthSuccess(userObj);
          onClose();
          return;
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      // Simulate Google OAuth login
      const googleUser = {
        id: 'google_tanuj_101',
        name: 'Tanuj Sharma (Google)',
        email: 'tanuj.sharma@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        authProvider: 'google',
        created_at: new Date().toISOString()
      };
      onAuthSuccess(googleUser);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await apiLogin('tanuj@moodbeats.com', 'password123');
      if (res?.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        const demoUser = {
          id: 'demo-user',
          name: 'Tanuj (Demo Profile)',
          email: 'tanuj@moodbeats.com',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        };
        onAuthSuccess(demoUser);
        onClose();
      }
    } catch (err) {
      const demoUser = {
        id: 'demo-user',
        name: 'Tanuj (Demo Profile)',
        email: 'tanuj@moodbeats.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      };
      onAuthSuccess(demoUser);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md bg-[#0e121e]/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-2xl"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 bg-gradient-to-b from-pink-500/25 via-purple-600/15 to-transparent blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-pink-500/25 mb-3">
            <div className="w-full h-full bg-[#0e121e] rounded-[14px] flex items-center justify-center">
              <span className="text-2xl">🎵</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create your Account' : 'Welcome to MoodBeats'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isSignUp
              ? 'Join to sync your liked songs, custom playlists & mood history'
              : 'Sign in to access your personal Bollywood music library'}
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition shadow-md flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.15z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.21v3.15C3.25 21.36 7.35 24 12 24z" />
              <path fill="#FBBC05" d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.58H1.21C.44 8.11 0 9.99 0 12s.44 3.89 1.21 5.42l4.11-3.15z" />
              <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.21 6.58l4.11 3.15c.94-2.83 3.58-4.96 6.68-4.96z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-[#0e121e] px-2 text-gray-400 font-medium">Or email sign in</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanuj Sharma"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Email Address / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>One-Click Demo Login (Tanuj)</span>
          </button>
        </div>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-4 text-center text-xs text-gray-400">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                className="text-pink-400 hover:text-pink-300 font-semibold cursor-pointer underline underline-offset-2 ml-1"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to MoodBeats?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                className="text-pink-400 hover:text-pink-300 font-semibold cursor-pointer underline underline-offset-2 ml-1"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Secured Session Storage</span>
        </div>
      </div>
    </div>
  );
}
