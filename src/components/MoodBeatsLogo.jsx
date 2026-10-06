import React from 'react';
import { Sparkles } from 'lucide-react';

export default function MoodBeatsLogo({ className = "w-9 h-9", textClassName = "text-xl", showText = true, showBadge = false }) {
  return (
    <div className="flex items-center gap-3 select-none cursor-pointer group">
      <div className={`relative ${className} rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
        <span className="text-lg sm:text-xl">🎵</span>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-display font-black tracking-tight text-white ${textClassName}`}>
              Mood<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Beats</span>
            </span>
            {showBadge && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> AI Music
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
