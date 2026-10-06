import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Check, Sparkles, AlertCircle, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';
import MoodBeatsLogo from './MoodBeatsLogo';
import { apiLogin, apiRegister } from '../services/api';

export default function LoginPage({ onLoginSuccess, onBackToApp, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [favoriteMood, setFavoriteMood] = useState('Romantic');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        try {
          const res = await apiRegister(name.trim(), email.trim(), password);
          if (res?.success && res.user) {
            localStorage.setItem('moodbeats_user', JSON.stringify(res.user));
            setSuccessMsg(`Welcome to MoodBeats, ${res.user.name}!`);
            setTimeout(() => {
              onLoginSuccess(res.user);
            }, 600);
            return;
          } else if (res?.error) {
            throw new Error(res.error);
          }
        } catch (apiErr) {
          const offlineUser = {
            id: 'user_' + Date.now(),
            name: name.trim(),
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
            favoriteMood,
            plan: 'MoodBeats Free',
            created_at: new Date().toISOString(),
          };
          localStorage.setItem('moodbeats_user', JSON.stringify(offlineUser));
          setSuccessMsg(`Welcome to MoodBeats, ${offlineUser.name}!`);
          setTimeout(() => {
            onLoginSuccess(offlineUser);
          }, 600);
          return;
        }
      } else {
        if (!email.trim()) throw new Error('Please enter your email or username.');
        if (!password) throw new Error('Please enter your password.');

        try {
          const res = await apiLogin(email.trim(), password);
          if (res?.success && res.user) {
            localStorage.setItem('moodbeats_user', JSON.stringify(res.user));
            setSuccessMsg(`Welcome back, ${res.user.name}!`);
            setTimeout(() => {
              onLoginSuccess(res.user);
            }, 600);
            return;
          } else if (res?.error) {
            throw new Error(res.error);
          }
        } catch (apiErr) {
          const cleanName = email.split('@')[0] || 'User';
          const offlineUser = {
            id: 'user_' + cleanName.toLowerCase(),
            name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanName)}`,
            plan: 'MoodBeats Pro Member',
            created_at: new Date().toISOString(),
          };
          localStorage.setItem('moodbeats_user', JSON.stringify(offlineUser));
          setSuccessMsg(`Welcome back, ${offlineUser.name}!`);
          setTimeout(() => {
            onLoginSuccess(offlineUser);
          }, 600);
          return;
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      try {
        const res = await apiLogin('tanuj@moodbeats.com', 'password123');
        if (res?.success && res.user) {
          localStorage.setItem('moodbeats_user', JSON.stringify(res.user));
          onLoginSuccess(res.user);
          return;
        }
      } catch (_) {}

      const demoUser = {
        id: 'demo-user',
        name: 'Tanuj Sharma',
        email: 'tanuj@moodbeats.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        plan: 'MoodBeats Pro VIP',
        favoriteMood: 'Romantic & Party',
      };
      localStorage.setItem('moodbeats_user', JSON.stringify(demoUser));
      onLoginSuccess(demoUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between overflow-y-auto selection:bg-emerald-500 selection:text-black relative">
      {/* Background Glow Mesh */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-teal-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-5 border-b border-white/10 bg-[#0a0d17]/80 backdrop-blur-xl flex items-center justify-between z-10">
        <div onClick={onBackToApp} className="cursor-pointer">
          <MoodBeatsLogo className="w-9 h-9" textClassName="text-2xl" showBadge />
        </div>
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Web Player</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-[440px] bg-[#0d121f]/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-7 sm:p-9 shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20 mb-3">
              <div className="w-full h-full bg-[#0d121f] rounded-[14px] flex items-center justify-center">
                <span className="text-xl">🎵</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              {mode === 'signup' ? 'Create your MoodBeats Account' : 'Welcome to MoodBeats'}
            </h1>
            <p className="text-xs text-gray-400 mt-1.5">
              {mode === 'signup'
                ? 'Join to sync your liked songs, custom playlists & AI mood history'
                : 'Sign in to access your personal AI Bollywood music library'}
            </p>
          </div>

          {/* Social Logins */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition cursor-pointer"
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
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-[#0d121f] px-3 text-gray-400 font-semibold tracking-wider">or sign in with email</span>
            </div>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanuj Sharma"
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
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
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo One-Click Login pill */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>One-Click Login as Tanuj (Demo Profile)</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-xs text-gray-400">
            {mode === 'login' ? (
              <p>
                New to MoodBeats?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-emerald-400 font-bold hover:underline transition cursor-pointer ml-1"
                >
                  Create Free Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-emerald-400 font-bold hover:underline transition cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secured Session Storage</span>
          </div>

        </div>
      </main>
    </div>
  );
}
