import React from 'react';
import { Play, Pause, Heart, Bookmark, Info, Sparkles } from 'lucide-react';

function SongCard({
  song,
  onPlay,
  isCurrentlyPlaying,
  isPlaying,
  onFeedback,
  onMoreLikeThis,
  onShowDetails,
  feedbackState = {},
}) {
  if (!song) return null;

  const isLiked = feedbackState[song.id] === 'like';
  const isSaved = feedbackState[song.id] === 'save';

  const handleCardClick = (e) => {
    e?.stopPropagation?.();
    if (onPlay) onPlay(song);
  };

  const title = song.music_name || song.title || 'Bollywood Track';
  const singer = song.singer || song.artist || 'Bollywood';
  const thumb =
    song.thumbnail ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  const mood = song.primary_mood || 'Bollywood';

  return (
    <div
      className={`group relative rounded-2xl glass-card overflow-hidden flex flex-col justify-between transition-all duration-200 ${
        isCurrentlyPlaying
          ? 'ring-2 ring-pink-500/80 bg-pink-500/[0.06] shadow-lg shadow-pink-500/20'
          : 'border-white/10 hover:border-pink-500/40 hover:shadow-xl hover:shadow-black/60'
      }`}
    >
      {/* ── Album Artwork Container + Vinyl Disc Peek ── */}
      <div
        onClick={handleCardClick}
        className="relative aspect-square w-full overflow-hidden bg-black/60 cursor-pointer select-none"
      >
        {/* Animated Vinyl Disc that peeks out when playing */}
        <div
          className={`absolute top-2 right-2 w-28 h-28 rounded-full vinyl-disc transition-all duration-700 pointer-events-none z-0 ${
            isCurrentlyPlaying
              ? 'translate-x-6 -translate-y-2 opacity-95 animate-spin-slow shadow-2xl'
              : 'translate-x-0 translate-y-0 opacity-0 group-hover:translate-x-3 group-hover:opacity-40'
          }`}
        >
          {/* Vinyl center hole ring */}
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full border border-white/20 bg-black/80 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
          </div>
        </div>

        {/* Cover Art Image */}
        <img
          src={thumb}
          alt={title}
          className={`relative z-10 w-full h-full object-cover object-center transition-transform duration-500 ${
            isCurrentlyPlaying ? 'scale-105 brightness-95' : 'group-hover:scale-105'
          }`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
          }}
          loading="lazy"
        />

        {/* Vignette Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0d18] via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Mood Pill Badge (Minimal & Clean) */}
        {mood && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase backdrop-blur-md bg-black/60 text-white/90 border border-white/15 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              {mood}
            </span>
          </div>
        )}

        {/* Center Play Button or Equalizer Spectrum */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          {isCurrentlyPlaying ? (
            <button
              type="button"
              onClick={handleCardClick}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Pause/Play"
            >
              <div className="flex items-end gap-1 h-5 pb-0.5">
                <span className="w-1 bg-white rounded-full eq-bar-1" />
                <span className="w-1 bg-white rounded-full eq-bar-2" />
                <span className="w-1 bg-white rounded-full eq-bar-3" />
                <span className="w-1 bg-white rounded-full eq-bar-4" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCardClick}
              className="w-12 h-12 rounded-full bg-white text-gray-950 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl shadow-black/80 cursor-pointer"
              title="Play Now"
            >
              <Play className="w-5 h-5 ml-0.5 fill-current text-gray-950" />
            </button>
          )}
        </div>
      </div>

      {/* ── Metadata & Controls Row ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between z-10">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <h4
              onClick={handleCardClick}
              className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-pink-300 transition-colors cursor-pointer"
              title={title}
            >
              {title}
            </h4>
            <button
              type="button"
              onClick={() => onShowDetails && onShowDetails(song)}
              className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg cursor-pointer shrink-0 transition"
              title="View Mood Analysis & Lyrics"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-400 line-clamp-1 mb-3 font-normal" title={singer}>
            {singer}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
          {/* Quick Play Trigger */}
          <button
            type="button"
            onClick={handleCardClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCurrentlyPlaying
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30'
                : 'bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white'
            }`}
          >
            {isCurrentlyPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Like, Save & Similar Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onFeedback && onFeedback(song.id, 'like')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isLiked
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm shadow-pink-500/30'
                  : 'text-gray-400 hover:text-pink-400 hover:bg-white/5'
              }`}
              title={isLiked ? 'Liked' : 'Like track'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onFeedback && onFeedback(song.id, 'save')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isSaved
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm shadow-purple-500/30'
                  : 'text-gray-400 hover:text-purple-400 hover:bg-white/5'
              }`}
              title={isSaved ? 'Saved in Library' : 'Save to Library'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-purple-400 text-purple-400' : ''}`} />
            </button>

            {onMoreLikeThis && (
              <button
                type="button"
                onClick={() => onMoreLikeThis(song.id, title)}
                className="p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                title="Find Similar Vibes"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SongCard);
