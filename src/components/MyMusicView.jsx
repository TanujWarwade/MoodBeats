import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, History, Sparkles, User, Flame, Disc, Calendar, Music } from 'lucide-react';
import SongCard from './SongCard';
import { getUserProfile, getUserLibrary, getPersonalized } from '../services/api';

export default function MyMusicView({
  onPlay,
  onFeedback,
  onMoreLikeThis,
  onShowDetails,
  feedbackState,
}) {
  const [activeTab, setActiveTab] = useState('liked'); // 'liked' | 'saved' | 'recent' | 'personalized'
  const [profile, setProfile] = useState(null);
  const [library, setLibrary] = useState({ liked: [], saved: [], recently_played: [] });
  const [personalizedSongs, setPersonalizedSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profRes, libRes, persRes] = await Promise.all([
        getUserProfile('demo-user'),
        getUserLibrary('demo-user'),
        getPersonalized('demo-user', null, 10),
      ]);

      if (profRes && profRes.profile) setProfile(profRes.profile);
      if (libRes) setLibrary(libRes);
      if (persRes && persRes.recommendations) setPersonalizedSongs(persRes.recommendations);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [feedbackState]);

  const activeSongs = {
    liked: library.liked || [],
    saved: library.saved || [],
    recent: library.recently_played || [],
    personalized: personalizedSongs || [],
  }[activeTab];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Profile / Music Personality Banner (Section 24) */}
      <div className="relative rounded-3xl p-6 sm:p-8 mb-10 overflow-hidden glass-panel border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                <User className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-pink-400">
                  User Music Profile
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  Demo User's Library
                </h2>
                <p className="text-xs text-gray-400">
                  Every like, save, and skip continuously refines your Bollywood taste profile.
                </p>
              </div>
            </div>

            {/* Interaction Summary Counters */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-lg font-extrabold text-pink-400">
                  {profile?.total_likes || library.liked?.length || 0}
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Liked</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-lg font-extrabold text-purple-400">
                  {profile?.total_saves || library.saved?.length || 0}
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Saved</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-lg font-extrabold text-indigo-400">
                  {profile?.total_plays || library.recently_played?.length || 0}
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Played</span>
              </div>
            </div>
          </div>

          {/* "Your Music Personality" Box (Section 24 explicit requirement) */}
          <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Your Music Personality
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-pink-500/20 text-pink-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">Most Liked Mood</span>
                  <div className="text-sm font-bold text-white">
                    {profile?.favorite_mood || 'Romantic'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">Favorite Singer</span>
                  <div className="text-sm font-bold text-white truncate max-w-[170px]">
                    {profile?.favorite_singer || 'Arijit Singh'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">Preferred Era</span>
                  <div className="text-sm font-bold text-white">
                    {profile?.preferred_release || '2019–2023'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Library Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'liked'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          Liked Songs ({library.liked?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Saved Songs ({library.saved?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'recent'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Recently Played ({library.recently_played?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('personalized')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'personalized'
              ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-lg shadow-pink-500/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Curated For You ({personalizedSongs?.length || 0})
        </button>
      </div>

      {/* Tab Content Display */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-400 text-xs">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Syncing library and preferences...
        </div>
      ) : activeSongs && activeSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {activeSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPlay={onPlay}
              onFeedback={onFeedback}
              onMoreLikeThis={onMoreLikeThis}
              onShowDetails={onShowDetails}
              feedbackState={feedbackState}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass-card rounded-2xl p-8 max-w-md mx-auto">
          <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">
            No {activeTab} songs yet.
          </h4>
          <p className="text-xs text-gray-400 mb-4">
            Listen to recommendations and like or save songs to see them appear here and shape your AI music profile!
          </p>
        </div>
      )}
    </div>
  );
}
