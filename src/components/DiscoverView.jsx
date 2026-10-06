import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Play,
  Pause,
  X,
  Radio,
  Music2,
  Sparkles,
  Flame,
  Zap,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import SongCard from './SongCard';
import {
  discoverSongs,
  getRecommendationsByMood,
  getRecommendationsByText,
  DEFAULT_MOODS,
} from '../services/api';

const CURATED_ARTISTS = [
  { id: 'arijit', label: 'Arijit Singh', icon: '👑', query: 'Arijit Singh' },
  { id: 'atif', label: 'Atif Aslam', icon: '✨', query: 'Atif Aslam' },
  { id: 'kk', label: 'KK', icon: '🎤', query: 'KK' },
  { id: 'shreya', label: 'Shreya Ghoshal', icon: '💖', query: 'Shreya Ghoshal' },
  { id: 'sonu', label: 'Sonu Nigam', icon: '🎶', query: 'Sonu Nigam' },
  { id: 'jubin', label: 'Jubin Nautiyal', icon: '🌟', query: 'Jubin Nautiyal' },
  { id: 'mohit', label: 'Mohit Chauhan', icon: '🎸', query: 'Mohit Chauhan' },
  { id: 'badshah', label: 'Badshah', icon: '⚡', query: 'Badshah' },
  { id: 'neha', label: 'Neha Kakkar', icon: '🎵', query: 'Neha Kakkar' },
  { id: 'pritam', label: 'Pritam', icon: '🎹', query: 'Pritam' },
];

const SORT_OPTIONS = [
  { value: 'trending', label: '🔥 Trending Superhits' },
  { value: 'newest', label: '🆕 Modern Hits' },
  { value: 'alphabetical', label: '🔤 Title (A–Z)' },
  { value: 'oldest', label: '📻 Vintage Classics' },
];

export default function DiscoverView({
  moods = DEFAULT_MOODS,
  onPlay,
  currentPlayingTrack,
  isPlaying,
  onFeedback,
  onMoreLikeThis,
  onShowDetails,
  feedbackState,
}) {
  // --- Search & Input states ---
  const [searchQuery, setSearchQuery] = useState('');
  const [naturalTextInput, setNaturalTextInput] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const [activeMoodDetection, setActiveMoodDetection] = useState(null);

  // --- Active Filters ---
  const [selectedMood, setSelectedMood] = useState('');
  const [activeArtist, setActiveArtist] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [viewMode, setViewMode] = useState('grid');

  // --- Catalog & Search Results ---
  const [songs, setSongs] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Local client-side cache for instant zero-latency switching
  const localCache = useRef(new Map());
  const abortControllerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Effective moods list (never empty)
  const moodList = moods && moods.length > 0 ? moods : DEFAULT_MOODS;

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 1. Fetch Main Trending Catalog (Instant Cached)
  // ─────────────────────────────────────────────────────────────
  const loadCatalog = useCallback(async (sort = sortBy) => {
    setIsLoading(true);
    setActiveMoodDetection(null);

    const cacheKey = `catalog_${sort}`;
    if (localCache.current.has(cacheKey)) {
      const cached = localCache.current.get(cacheKey);
      setSongs(cached.songs);
      setTotal(cached.total);
      setIsLoading(false);
      return;
    }

    try {
      const res = await discoverSongs({ sortBy: sort, limit: 80 });
      if (res?.success) {
        setSongs(res.songs || []);
        setTotal(res.total || 0);
        localCache.current.set(cacheKey, { songs: res.songs, total: res.total });
      }
    } catch (err) {
      console.error('Catalog fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  // Initial load
  useEffect(() => {
    loadCatalog('trending');
  }, [loadCatalog]);

  // Pre-fetch top moods in background after initial catalog load
  useEffect(() => {
    const prefetchTimer = setTimeout(() => {
      ['Romantic', 'Happy', 'Sad', 'Calm'].forEach((m) => {
        getRecommendationsByMood(m, 60, 'demo-user').catch(() => {});
      });
    }, 1500);
    return () => clearTimeout(prefetchTimer);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. Instant Mood Selection (0ms Delay with Local Cache)
  // ─────────────────────────────────────────────────────────────
  const handleMoodSelect = useCallback(async (moodId) => {
    if (selectedMood === moodId) {
      // Deselect
      setSelectedMood('');
      setActiveArtist('');
      setSearchQuery('');
      setActiveMoodDetection(null);
      loadCatalog(sortBy);
      return;
    }

    setSelectedMood(moodId);
    setActiveArtist('');
    setSearchQuery('');
    setActiveMoodDetection(null);
    setShowDropdown(false);

    // Check instant local memory cache first
    const cacheKey = `mood_${moodId}`;
    if (localCache.current.has(cacheKey)) {
      const cached = localCache.current.get(cacheKey);
      setSongs(cached.songs);
      setTotal(cached.total);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getRecommendationsByMood(moodId, 60, 'demo-user');
      if (res?.success) {
        const recs = res.recommendations || [];
        setSongs(recs);
        setTotal(recs.length);
        localCache.current.set(cacheKey, { songs: recs, total: recs.length });
      }
    } catch (err) {
      console.error('Mood fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMood, sortBy, loadCatalog]);

  // ─────────────────────────────────────────────────────────────
  // 3. Instant Artist Superhits Selection
  // ─────────────────────────────────────────────────────────────
  const handleArtistSelect = useCallback(async (artist) => {
    if (activeArtist === artist.id) {
      setActiveArtist('');
      loadCatalog(sortBy);
      return;
    }

    setActiveArtist(artist.id);
    setSelectedMood('');
    setSearchQuery('');
    setActiveMoodDetection(null);
    setShowDropdown(false);

    const cacheKey = `artist_${artist.query}`;
    if (localCache.current.has(cacheKey)) {
      const cached = localCache.current.get(cacheKey);
      setSongs(cached.songs);
      setTotal(cached.total);
      return;
    }

    setIsLoading(true);
    try {
      const res = await discoverSongs({ query: artist.query, sortBy: 'trending', limit: 60 });
      if (res?.success) {
        const found = res.songs || [];
        setSongs(found);
        setTotal(res.total || found.length);
        localCache.current.set(cacheKey, { songs: found, total: res.total || found.length });
      }
    } catch (err) {
      console.error('Artist fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeArtist, sortBy, loadCatalog]);

  // ─────────────────────────────────────────────────────────────
  // 4. Zero-Delay Keystroke Search (Instant local filter + Debounced API)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      if (activeArtist || selectedMood) return;
      loadCatalog(sortBy);
      setShowDropdown(false);
      return;
    }

    // Cancel previous inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await discoverSongs({
          query: q,
          sortBy: 'trending',
          limit: 60,
          signal: controller.signal,
        });
        if (res?.success) {
          setSongs(res.songs || []);
          setTotal(res.total || 0);
          setShowDropdown(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeArtist, selectedMood, sortBy, loadCatalog]);

  // ─────────────────────────────────────────────────────────────
  // 5. Natural Language AI Mood Recommender
  // ─────────────────────────────────────────────────────────────
  const handleAiTextSubmit = async (e) => {
    e?.preventDefault?.();
    const txt = naturalTextInput.trim();
    if (!txt) return;

    setIsAiDetecting(true);
    setIsLoading(true);
    setSelectedMood('');
    setActiveArtist('');
    setSearchQuery('');

    try {
      const res = await getRecommendationsByText(txt, 60, 'demo-user');
      if (res?.success) {
        setActiveMoodDetection({
          mood: res.mood,
          confidence: res.confidence,
          explanation: res.explanation,
        });
        setSongs(res.recommendations || []);
        setTotal(res.count || res.recommendations?.length || 0);
      }
    } catch (err) {
      console.error('AI Text Mood error:', err);
    } finally {
      setIsAiDetecting(false);
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6. Reset All Filters
  // ─────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedMood('');
    setActiveArtist('');
    setSearchQuery('');
    setNaturalTextInput('');
    setActiveMoodDetection(null);
    setShowDropdown(false);
    loadCatalog('trending');
  };

  const isFiltered = Boolean(selectedMood || activeArtist || searchQuery || activeMoodDetection);

  // Active mood details for ambient lighting
  const activeMoodObj = useMemo(() => {
    return moodList.find((m) => m.id === selectedMood) || null;
  }, [moodList, selectedMood]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

      {/* ── Top Hero Banner ── */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs font-semibold mb-4 backdrop-blur-md shadow-sm">
          <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>24,000+ Bollywood Tracks • AI Emotion Recommender</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4">
          Discover Bollywood Music by <span className="gradient-text">Your Exact Mood</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-300 font-light max-w-xl mx-auto mb-6">
          Instant zero-delay search, emotion-matched playlists, and pure audiovisual immersion.
        </p>

        {/* Quick Mode Toggle (Standard Search vs AI Emotion Detector) */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowAiPrompt(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              !showAiPrompt
                ? 'bg-white/15 text-white border border-white/20 shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search &amp; Moods</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAiPrompt(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              showAiPrompt
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>AI Emotion Prompt</span>
          </button>
        </div>
      </div>

      {/* ── Main Control Console ── */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl mb-8 space-y-4">

        {/* ── AI Emotion Natural Language Prompt (When active) ── */}
        {showAiPrompt ? (
          <form onSubmit={handleAiTextSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={naturalTextInput}
                onChange={(e) => setNaturalTextInput(e.target.value)}
                placeholder="Describe your mood (e.g. 'late night drive with deep emotional feels', 'workout gym energy')..."
                className="w-full bg-white/5 border border-purple-500/30 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isAiDetecting || !naturalTextInput.trim()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-90 text-white text-sm font-bold shadow-lg shadow-pink-500/25 transition disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-2"
            >
              {isAiDetecting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-current" />
              )}
              <span>Analyze Mood</span>
            </button>
          </form>
        ) : (
          /* ── Standard Search Bar with Instant Autocomplete Dropdown ── */
          <div ref={searchContainerRef} className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedMood('');
                  setActiveArtist('');
                }}
                onFocus={() => {
                  if (songs && songs.length > 0 && searchQuery) setShowDropdown(true);
                }}
                placeholder="Search song title or singer (e.g. Kesariya, Arijit Singh, Tum Hi Ho)..."
                className="w-full bg-white/5 border border-white/15 rounded-2xl pl-11 pr-24 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition shadow-inner"
              />

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowDropdown(false);
                      loadCatalog(sortBy);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Autocomplete Suggestions Dropdown */}
            {showDropdown && searchQuery.trim() && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#0c101d]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/5">
                <div className="px-4 py-2.5 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span>Direct Matches</span>
                  <span className="text-pink-400 font-bold">{songs.length} tracks</span>
                </div>
                {songs.slice(0, 6).map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      onPlay(song, songs);
                      setShowDropdown(false);
                    }}
                    className="group flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/10 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.thumbnail}
                        alt={song.music_name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                          {song.music_name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{song.singer}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-full bg-pink-600 text-white shadow-md group-hover:scale-105 transition cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Hot Picks / Iconic Artists Bar ── */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 border-t border-white/5 no-scrollbar">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Hot Artists:
          </span>
          {CURATED_ARTISTS.map((art) => {
            const isSel = activeArtist === art.id;
            return (
              <button
                key={art.id}
                type="button"
                onClick={() => handleArtistSelect(art)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-white/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
                }`}
              >
                <span>{art.icon}</span>
                <span>{art.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Mood Pills Matrix + Sort Dropdown ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Mood Vibe:
            </span>

            {/* "All" reset pill */}
            <button
              type="button"
              onClick={handleReset}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                !selectedMood && !activeArtist && !searchQuery && !activeMoodDetection
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
              }`}
            >
              All Tracks
            </button>

            {/* Mood Pills */}
            {moodList.map((m) => {
              const isSel = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMoodSelect(m.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSel
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-lg shadow-pink-500/30 ring-1 ring-white/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
                  }`}
                >
                  <span className="text-sm">{m.emoji}</span>
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Toolbar: View mode + Sort */}
          <div className="flex items-center gap-3 ml-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Compact List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  loadCatalog(e.target.value);
                }}
                disabled={Boolean(selectedMood || activeMoodDetection)}
                className="bg-transparent text-xs text-white focus:outline-none disabled:opacity-40 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-gray-900 text-white">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* ── AI Mood Detection Banner ── */}
      {activeMoodDetection && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-indigo-900/30 border border-pink-500/30 flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">✨</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-300">AI Detected Emotion:</span>
                <span className="text-xs font-bold text-pink-300 px-3 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40">
                  {activeMoodDetection.mood} ({Math.round(activeMoodDetection.confidence * 100)}% match)
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{activeMoodDetection.explanation}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition"
            title="Reset to all tracks"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Results Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-base font-bold text-white tracking-wide">
            {isLoading ? 'Loading tracks...' : `${total.toLocaleString()} Tracks`}
          </span>

          {selectedMood && (
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Vibe: {selectedMood}
            </span>
          )}

          {activeArtist && (
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Artist: {CURATED_ARTISTS.find((a) => a.id === activeArtist)?.label || activeArtist}
            </span>
          )}

          {searchQuery && (
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Search: "{searchQuery}"
            </span>
          )}

          {isFiltered && (
            <button
              onClick={handleReset}
              className="text-xs font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4 cursor-pointer ml-1 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Song Results View (Grid or Dense List) ── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPlay={(s) => onPlay(s, songs)}
              isCurrentlyPlaying={currentPlayingTrack?.id === song.id}
              isPlaying={isPlaying}
              onFeedback={onFeedback}
              onMoreLikeThis={onMoreLikeThis}
              onShowDetails={onShowDetails}
              feedbackState={feedbackState}
            />
          ))}
        </div>
      ) : (
        /* Compact List Mode */
        <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-white/5 border border-white/10">
          {songs.map((song, idx) => {
            const isCurrent = currentPlayingTrack?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => onPlay(song, songs)}
                className={`group flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/10 transition cursor-pointer ${
                  isCurrent ? 'bg-pink-500/10 border-l-4 border-pink-500' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-gray-500 w-6 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={song.thumbnail}
                    alt={song.music_name}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10 shadow"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200';
                    }}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        isCurrent ? 'text-pink-400' : 'text-white group-hover:text-pink-300'
                      }`}
                    >
                      {song.music_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{song.singer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {song.primary_mood && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-gray-300 border border-white/10">
                      {song.primary_mood}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`p-2 rounded-full transition cursor-pointer ${
                      isCurrent
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-500/40'
                        : 'bg-white/10 text-white hover:bg-pink-600'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && songs.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 my-8">
          <Compass className="w-12 h-12 text-pink-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-2">No tracks matched your criteria</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-5">
            Try searching with a broader query, selecting another mood, or clicking below to reset.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition shadow-lg shadow-pink-600/30 cursor-pointer"
          >
            Show All Bollywood Superhits
          </button>
        </div>
      )}
    </div>
  );
}
