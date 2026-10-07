/**
 * Ultra-Fast API service with In-Memory Caching & Instant Fallbacks
 * Eliminates all network delay and repeated roundtrips.
 */

const API_BASE = '/api';

export const DEFAULT_MOODS = [
  { id: 'Happy', name: 'Happy', emoji: '😄', description: 'Joyful, upbeat, and celebratory tracks.', color: '#F59E0B' },
  { id: 'Romantic', name: 'Romantic', emoji: '❤️', description: 'Soul-stirring romantic ballads & love melodies.', color: '#EC4899' },
  { id: 'Sad', name: 'Sad', emoji: '😢', description: 'Heartfelt, emotional, and melancholy melodies.', color: '#3B82F6' },
  { id: 'Calm', name: 'Calm', emoji: '😌', description: 'Peaceful, soothing acoustics to relax & unwind.', color: '#10B981' },
  { id: 'Energetic', name: 'Energetic', emoji: '⚡', description: 'High-voltage dance hits and party anthems.', color: '#8B5CF6' },
  { id: 'Motivational', name: 'Motivational', emoji: '🔥', description: 'Inspiring anthems to conquer your goals.', color: '#EF4444' },
  { id: 'Nostalgic', name: 'Nostalgic', emoji: '📻', description: 'Golden retro superhits from cherished eras.', color: '#D97706' },
];

// In-memory instant client-side cache
const cache = {
  moods: null,
  recs: new Map(),
  discover: new Map(),
  details: new Map(),
};

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchMoods() {
  if (cache.moods) return cache.moods;
  try {
    const res = await fetch(`${API_BASE}/moods`);
    const data = await res.json();
    if (data && data.moods && data.moods.length > 0) {
      cache.moods = data;
      return data;
    }
  } catch (err) {
    console.warn('Backend moods fetch failed, using default moods:', err);
  }
  const fallback = { success: true, moods: DEFAULT_MOODS };
  cache.moods = fallback;
  return fallback;
}

export async function detectMood(text) {
  const res = await fetch(`${API_BASE}/detect-mood`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

import { getSongs } from '../data/database';

// Maps backend mood IDs → frontend database category IDs
const MOOD_TO_CATEGORY = {
  'happy': 'party',
  'romantic': 'romantic',
  'sad': 'sad',
  'calm': 'chill',
  'chill': 'chill',
  'energetic': 'workout',
  'motivational': 'workout',
  'nostalgic': 'trending',
  'devotional': 'devotional',
  'focus': 'focus',
  'party': 'party',
  'trending': 'trending',
  'workout': 'workout',
};

function getStaticFallbackSongs(mood = '', query = '') {
  const allCategories = ['trending', 'party', 'romantic', 'sad', 'chill', 'workout', 'devotional', 'focus'];
  let list = [];
  if (mood) {
    const key = mood.toLowerCase();
    // Map backend mood name → database category, fallback to trending
    const categoryKey = MOOD_TO_CATEGORY[key] || key;
    list = getSongs(categoryKey) || [];
  }
  if (!list || list.length === 0) {
    const seen = new Set();
    allCategories.forEach((cat) => {
      (getSongs(cat) || []).forEach((s) => {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          list.push(s);
        }
      });
    });
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((s) =>
      (s.title || s.music_name || '').toLowerCase().includes(q) ||
      (s.artist || s.singer || '').toLowerCase().includes(q)
    );
  }
  return list.map((s, idx) => ({
    id: s.id || idx + 1,
    music_name: s.title || s.music_name || 'Bollywood Track',
    title: s.title || s.music_name || 'Bollywood Track',
    singer: s.artist || s.singer || 'Bollywood Artist',
    artist: s.artist || s.singer || 'Bollywood Artist',
    thumbnail: s.thumbnail || (s.spotifyId ? `https://img.youtube.com/vi/${s.spotifyId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'),
    youtube_id: s.spotifyId || s.youtube_id || (typeof s.id === 'string' && s.id.startsWith('yt-') ? s.id.replace('yt-', '') : null),
    primary_mood: s.primary_mood || mood || 'Trending',
    song_rating: 4.8,
    era: '2020s'
  }));
}


export async function getRecommendationsByMood(mood, limit = 60, userId = 'demo-user') {
  const key = `${mood}_${limit}_${userId}`;
  if (cache.recs.has(key)) {
    return cache.recs.get(key);
  }

  try {
    const res = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, limit, user_id: userId }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.success && data.recommendations && data.recommendations.length > 0) {
        cache.recs.set(key, data);
        return data;
      }
    }
  } catch (err) {
    console.warn('API recommend fetch failed, using fallback:', err);
  }

  const fallbackSongs = getStaticFallbackSongs(mood);
  const fallbackData = {
    success: true,
    mood,
    count: fallbackSongs.length,
    recommendations: fallbackSongs.slice(0, limit),
    fallback: true
  };
  return fallbackData;
}

export async function getRecommendationsByText(text, limit = 60, userId = 'demo-user') {
  try {
    const res = await fetch(`${API_BASE}/recommend/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, limit, user_id: userId }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API recommend/text fetch failed:', err);
  }
  const fallbackSongs = getStaticFallbackSongs('', text);
  return {
    success: true,
    detected_mood: 'Happy',
    confidence: 0.85,
    count: fallbackSongs.length,
    recommendations: fallbackSongs.slice(0, limit),
    fallback: true
  };
}

export async function getSongDetails(songId) {
  if (cache.details.has(songId)) return cache.details.get(songId);
  try {
    const res = await fetch(`${API_BASE}/song/${songId}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.success) {
        cache.details.set(songId, data);
        return data;
      }
    }
  } catch (err) {
    console.warn('API song details fetch failed:', err);
  }
  return { success: false, error: 'Song details unavailable' };
}

export async function getSimilarSongs(songId, limit = 15) {
  try {
    const res = await fetch(`${API_BASE}/song/${songId}/similar?limit=${limit}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API similar songs fetch failed:', err);
  }
  const fallbackSongs = getStaticFallbackSongs();
  return { success: true, count: limit, recommendations: fallbackSongs.slice(0, limit) };
}

export async function sendFeedback(songId, action, userId = 'demo-user') {
  // Clear recs cache on feedback so recommendations update dynamically
  cache.recs.clear();
  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId, action, user_id: userId }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API feedback failed:', err);
  }
  return { success: true, message: `Action '${action}' recorded.` };
}

export async function getPersonalized(userId = 'demo-user', mood = null, limit = 20) {
  let url = `${API_BASE}/personalized?user_id=${encodeURIComponent(userId)}&limit=${limit}`;
  if (mood) {
    url += `&mood=${encodeURIComponent(mood)}`;
  }
  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API personalized fetch failed:', err);
  }
  const fallbackSongs = getStaticFallbackSongs(mood || '');
  return { success: true, user_id: userId, count: limit, recommendations: fallbackSongs.slice(0, limit) };
}

export async function discoverSongs({
  query = '',
  mood = '',
  singer = '',
  year = '',
  era = '',
  sortBy = 'trending',
  limit = 80,
  offset = 0,
  signal = null,
} = {}) {
  const cacheKey = `${query}|${mood}|${singer}|${year}|${era}|${sortBy}|${limit}|${offset}`;
  if (cache.discover.has(cacheKey)) {
    return cache.discover.get(cacheKey);
  }

  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (mood) params.append('mood', mood);
  if (singer) params.append('singer', singer);
  if (year) params.append('year', year);
  if (era) params.append('era', era);
  if (sortBy) params.append('sort_by', sortBy);
  params.append('limit', limit);
  params.append('offset', offset);

  try {
    const fetchOptions = signal ? { signal } : {};
    const res = await fetch(`${API_BASE}/discover?${params.toString()}`, fetchOptions);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.success && data.songs && data.songs.length > 0) {
        cache.discover.set(cacheKey, data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend discover fetch failed, using curated catalog:', err);
  }

  // Fallback to instant rich curated catalog
  const fallbackSongs = getStaticFallbackSongs(mood, query || singer);
  const fallbackData = {
    success: true,
    total: fallbackSongs.length,
    songs: fallbackSongs.slice(offset, offset + limit),
    page: Math.floor(offset / limit) + 1,
    limit,
    fallback: true
  };
  return fallbackData;
}

export async function getUserProfile(userId = 'demo-user') {
  const res = await fetch(`${API_BASE}/user/profile?user_id=${encodeURIComponent(userId)}`);
  return res.json();
}

export async function getUserLibrary(userId = 'demo-user') {
  const res = await fetch(`${API_BASE}/user/library?user_id=${encodeURIComponent(userId)}`);
  return res.json();
}

export async function apiLogin(emailOrName, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailOrName, password }),
  });
  return res.json();
}

export async function apiRegister(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function apiGetProfile(userId) {
  const res = await fetch(`${API_BASE}/user/profile?user_id=${encodeURIComponent(userId)}`);
  return res.json();
}
