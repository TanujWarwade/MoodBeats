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

export async function getRecommendationsByMood(mood, limit = 60, userId = 'demo-user') {
  const key = `${mood}_${limit}_${userId}`;
  if (cache.recs.has(key)) {
    return cache.recs.get(key);
  }

  const res = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, limit, user_id: userId }),
  });
  const data = await res.json();
  if (data?.success) {
    cache.recs.set(key, data);
  }
  return data;
}

export async function getRecommendationsByText(text, limit = 60, userId = 'demo-user') {
  const res = await fetch(`${API_BASE}/recommend/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, limit, user_id: userId }),
  });
  return res.json();
}

export async function getSongDetails(songId) {
  if (cache.details.has(songId)) return cache.details.get(songId);
  const res = await fetch(`${API_BASE}/song/${songId}`);
  const data = await res.json();
  if (data?.success) cache.details.set(songId, data);
  return data;
}

export async function getSimilarSongs(songId, limit = 15) {
  const res = await fetch(`${API_BASE}/song/${songId}/similar?limit=${limit}`);
  return res.json();
}

export async function sendFeedback(songId, action, userId = 'demo-user') {
  // Clear recs cache on feedback so recommendations update dynamically
  cache.recs.clear();
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_id: songId, action, user_id: userId }),
  });
  return res.json();
}

export async function getPersonalized(userId = 'demo-user', mood = null, limit = 20) {
  let url = `${API_BASE}/personalized?user_id=${encodeURIComponent(userId)}&limit=${limit}`;
  if (mood) {
    url += `&mood=${encodeURIComponent(mood)}`;
  }
  const res = await fetch(url);
  return res.json();
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

  const fetchOptions = signal ? { signal } : {};
  const res = await fetch(`${API_BASE}/discover?${params.toString()}`, fetchOptions);
  const data = await res.json();
  if (data?.success) {
    cache.discover.set(cacheKey, data);
  }
  return data;
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
