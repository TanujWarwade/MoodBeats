import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Radio, User, LogIn, LogOut, Heart, Bookmark, ChevronDown, Music } from 'lucide-react';

export default function Navbar({ currentTrack, isPlaying, user, onOpenAuth, onLogout, onOpenLibrary }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0b10] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">

        {/* ── Brand Logo ── */}
        <div className="flex items-center gap-3 select-none">
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl">🎵</span>
            </div>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 opacity-20 blur group-hover:opacity-40 transition" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-white">
                Mood<span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">Beats</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-pink-300 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-pink-400" /> AI Studio
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium tracking-wide">
              Smart Bollywood Recommendation Engine
            </p>
          </div>
        </div>

        {/* ── Center: Now Playing Pill ── */}
        {currentTrack && (
          <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm max-w-sm truncate">
            <div className="flex items-center gap-1">
              <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-pink-400 animate-pulse' : 'text-gray-400'}`} />
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-pink-400 rounded-full eq-bar-1" />
                  <span className="w-0.5 bg-purple-400 rounded-full eq-bar-2" />
                  <span className="w-0.5 bg-indigo-400 rounded-full eq-bar-3" />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">Playing:</span>
            <span className="text-xs font-semibold text-white truncate">
              {currentTrack.music_name}
            </span>
          </div>
        )}

        {/* ── Right: User Profile & Auth ── */}
        <div className="flex items-center gap-3">
          {/* Catalog badge */}
          <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            24,000+ Bollywood Tracks
          </span>

          {user ? (
            /* ── Logged In User Dropdown ── */
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-xl object-cover border border-white/15 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
                  }}
                />
                <span className="text-xs font-bold text-white max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform" />
              </button>

              {/* Profile Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0e121e]/98 border border-white/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email || 'Free Member'}</p>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {onOpenLibrary && (
                      <button
                        onClick={() => { onOpenLibrary(); setShowDropdown(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span>My Liked &amp; Saved Songs</span>
                      </button>
                    )}

                    <button
                      onClick={() => { onLogout(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Sign In / Register Buttons (When not logged in) ── */
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
