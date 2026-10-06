import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function MoodGrid({ moods, onSelectMood, selectedMood }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Lyrical Emotion Clustering
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
          What's your mood?
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Choose an emotion to generate an instant AI-ranked Bollywood playlist calibrated to poetic sentiment and vocabulary.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {moods && moods.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <div
              key={m.id}
              onClick={() => onSelectMood(m.id)}
              className={`group relative p-6 rounded-2xl glass-card cursor-pointer overflow-hidden border transition-all duration-300 ${
                isSelected
                  ? 'border-pink-500 ring-2 ring-pink-500/30 bg-white/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Corner Glow Accent */}
              <div 
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ backgroundColor: m.color || '#ec4899' }}
              />

              <div className="flex items-start justify-between mb-4">
                <span className="text-5xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  {m.emoji}
                </span>
                <span className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/15 text-gray-300 group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                {m.name}
              </h3>

              <p className="text-xs text-gray-300 leading-relaxed font-light mb-4">
                {m.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-gray-400">
                <span className="font-medium text-pink-400/90 group-hover:underline">
                  Explore Tracks →
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                  AI Calibrated
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
