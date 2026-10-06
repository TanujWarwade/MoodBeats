import React from 'react';
import { X, Play, ExternalLink, Sparkles, Heart, Bookmark, Disc } from 'lucide-react';

export default function SongModal({
  song,
  onClose,
  onPlay,
  onFeedback,
  onMoreLikeThis,
  feedbackState = {},
}) {
  if (!song) return null;

  const isLiked = feedbackState[song.id] === 'like';
  const isSaved = feedbackState[song.id] === 'save';

  const moodList = [
    { key: 'happy', label: 'Happy', emoji: '😄', color: 'from-amber-400 to-yellow-500' },
    { key: 'sad', label: 'Sad', emoji: '😢', color: 'from-blue-400 to-indigo-500' },
    { key: 'romantic', label: 'Romantic', emoji: '❤️', color: 'from-pink-500 to-rose-500' },
    { key: 'calm', label: 'Calm', emoji: '😌', color: 'from-emerald-400 to-teal-500' },
    { key: 'energetic', label: 'Energetic', emoji: '⚡', color: 'from-purple-500 to-violet-600' },
    { key: 'motivational', label: 'Motivational', emoji: '🔥', color: 'from-red-500 to-orange-500' },
    { key: 'nostalgic', label: 'Nostalgic', emoji: '🥹', color: 'from-indigo-400 to-purple-500' },
  ];

  const handleOpenYouTube = () => {
    let url = '';
    if (song.youtube_id) {
      url = `https://www.youtube.com/watch?v=${song.youtube_id}`;
    } else {
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.music_name} ${song.singer}`)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    onFeedback(song.id, 'play');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-gray-950/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
          <div className="w-full sm:w-44 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-gray-900 shrink-0 shadow-lg border border-white/10 relative group">
            <img
              src={song.thumbnail}
              alt={song.music_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600';
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  onPlay(song);
                  onFeedback(song.id, 'play');
                }}
                className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Primary: {song.primary_mood}
              </span>
              {song.secondary_mood && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300 border border-white/10">
                  Secondary: {song.secondary_mood}
                </span>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-black text-white mb-1.5 leading-snug">
              {song.music_name}
            </h3>
            <p className="text-sm text-gray-300 mb-4 font-light">
              By <span className="font-semibold text-white">{song.singer}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onPlay(song);
                  onFeedback(song.id, 'play');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> Play Now
              </button>

              <button
                onClick={handleOpenYouTube}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-red-400" /> Watch Video
              </button>

              <button
                onClick={() => onFeedback(song.id, 'like')}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${isLiked ? 'bg-pink-500/20 text-pink-400 border-pink-500/40' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400' : ''}`} />
              </button>

              <button
                onClick={() => onFeedback(song.id, 'save')}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${isSaved ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-purple-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Why this song? (Section 25 explicit requirement) */}
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Why this song?
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed font-light">
            {song.why_this_song || song.recommendation_reason || `Recommended because its lyrics strongly match the ${song.primary_mood} mood with verified emotional keywords.`}
          </p>
        </div>

        {/* 7 Mood Scores Visual Breakdown (Section 25 explicit requirement) */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-purple-400" /> Mood Scores Breakdown
          </h4>

          <div className="space-y-2.5">
            {moodList.map((m) => {
              const scoreVal = song.scores ? song.scores[m.key] || 0 : (song[`${m.key}_score`] || 0);
              const percentage = Math.min(100, Math.round(scoreVal * 250)); // Scale for visual display

              return (
                <div key={m.key} className="flex items-center gap-3 text-xs">
                  <span className="w-28 text-gray-300 flex items-center gap-1.5 shrink-0 font-medium">
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-700`}
                      style={{ width: `${Math.max(6, percentage)}%` }}
                    />
                  </div>

                  <span className="w-12 text-right font-mono text-[11px] text-gray-400 shrink-0">
                    {(scoreVal).toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* More Like This Action Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              onMoreLikeThis(song.id, song.music_name);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Find More Like This Song
          </button>
        </div>

      </div>
    </div>
  );
}
