import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, SlidersHorizontal, Music } from 'lucide-react';
import SongCard from './SongCard';

export default function RecommendationsView({
  recommendations,
  detectedMood,
  confidence,
  lowConfidence,
  explanation,
  userQuery,
  onSelectMood,
  moods,
  isLoading,
  error,
  onPlay,
  onFeedback,
  onMoreLikeThis,
  onShowDetails,
  feedbackState,
  onRefresh,
}) {
  const currentMoodObj = moods?.find((m) => m.id.toLowerCase() === (detectedMood || '').toLowerCase()) || {
    id: detectedMood || 'Romantic',
    emoji: '🎵',
    name: detectedMood || 'Romantic',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Playlist Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 mb-10 overflow-hidden glass-panel border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{currentMoodObj.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-pink-400">
                AI Mood Playlist
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Your Mood Playlist
            </h2>

            {userQuery && (
              <p className="text-sm text-gray-300 mb-3 font-light italic">
                "{userQuery}"
              </p>
            )}

            {/* Detected Mood & Confidence Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm">
                <span>Detected Mood:</span>
                <span className="text-pink-300 font-bold">{currentMoodObj.emoji} {currentMoodObj.name}</span>
              </div>

              {confidence !== undefined && (
                <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Confidence: {Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>

            {explanation && (
              <p className="text-xs text-gray-400 mt-2.5 max-w-xl">
                {explanation}
              </p>
            )}
          </div>

          {/* Quick Mood Manual Switcher (Section 10 Requirement) */}
          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 flex flex-col gap-2 max-w-xs">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-pink-400" /> Switch Mood:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {moods && moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMood(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    m.id.toLowerCase() === (detectedMood || '').toLowerCase()
                      ? 'bg-pink-500 text-white font-bold'
                      : 'bg-white/5 hover:bg-white/15 text-gray-300'
                  }`}
                >
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Low Confidence Warning Message (Section 10) */}
        {lowConfidence && (
          <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Your mood seems to be <strong>{currentMoodObj.name}</strong>, but our confidence is lower than usual. If this doesn't feel right, tap any mood button above to adjust!
            </span>
          </div>
        )}
      </div>

      {/* Loading State (Section 26) */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1">
            Finding songs that match your mood...
          </h3>
          <p className="text-xs text-gray-400">
            Running TF-IDF lyrical similarity and personalizing rankings.
          </p>
        </div>
      )}

      {/* Error State (Section 26) */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white mb-1">Something went wrong.</h3>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Please try again
          </button>
        </div>
      )}

      {/* Empty State (Section 26) */}
      {!isLoading && !error && (!recommendations || recommendations.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
            🔍
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">
            No songs found for this mood.
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Try choosing another emotion or search with different keywords.
          </p>
          <div className="flex gap-2">
            {moods?.slice(0, 3).map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMood(m.id)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white cursor-pointer"
              >
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid (Section 20: 10 recommendation cards) */}
      {!isLoading && !error && recommendations && recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Top {recommendations.length} Recommended Tracks
            </span>
            <span className="text-xs text-gray-400">
              Ranked by 70% Cosine Similarity + 30% Lyrical Mood Score
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {recommendations.map((song) => (
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
        </div>
      )}
    </div>
  );
}
