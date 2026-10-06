import React, { useState, useEffect } from 'react';
import { X, Heart, Bookmark, History, Play, Pause, Music } from 'lucide-react';
import { getUserLibrary } from '../services/api';

export default function LibraryModal({ isOpen, onClose, user, onPlay, currentPlayingTrack, isPlaying }) {
  const [activeTab, setActiveTab] = useState('liked');
  const [libraryData, setLibraryData] = useState({ liked: [], saved: [], recently_played: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setIsLoading(true);
    getUserLibrary(user.id)
      .then((data) => {
        if (data) {
          setLibraryData({
            liked: data.liked || [],
            saved: data.saved || [],
            recently_played: data.recently_played || [],
          });
        }
      })
      .catch((err) => console.error('Library fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentList =
    activeTab === 'liked'
      ? libraryData.liked
      : activeTab === 'saved'
      ? libraryData.saved
      : libraryData.recently_played;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-2xl bg-[#0e121e]/95 border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Your Music Collection</h2>
              <p className="text-xs text-gray-400">Curated specifically for {user?.name || 'you'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'liked'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeTab === 'liked' ? 'fill-white' : ''}`} />
            <span>Liked Tracks ({libraryData.liked.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${activeTab === 'saved' ? 'fill-white' : ''}`} />
            <span>Saved ({libraryData.saved.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recently Played</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading your library...
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <div className="text-3xl mb-2">🎧</div>
              <p className="font-semibold text-white">No tracks here yet</p>
              <p className="text-gray-500 mt-1">Tap the heart or bookmark icon on any track to add it here!</p>
            </div>
          ) : (
            currentList.map((song, idx) => {
              const isCur = currentPlayingTrack?.id === song.id && isPlaying;
              return (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => onPlay(song, currentList)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-white/10 border border-white/5 transition-all cursor-pointer ${
                    isCur ? 'bg-pink-500/15 border-pink-500/30' : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.thumbnail}
                      alt={song.music_name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200';
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isCur ? 'text-pink-400' : 'text-white'}`}>
                        {song.music_name}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {song.singer} {song.release ? `· ${song.release}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {song.primary_mood && (
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-gray-300 border border-white/10">
                        {song.primary_mood}
                      </span>
                    )}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
                    >
                      {isCur ? (
                        <Pause className="w-3.5 h-3.5 fill-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
