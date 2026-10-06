import React, { useState } from 'react';
import { Search, Sparkles, Wand2, ArrowRight } from 'lucide-react';

export default function HeroSection({ onSearchText, onSelectMood, moods, isLoading }) {
  const [inputText, setInputText] = useState('');

  const samplePrompts = [
    { label: "😢 Feeling sad", text: "I am feeling very sad today" },
    { label: "❤️ Romantic vibes", text: "I want romantic songs" },
    { label: "😌 Peaceful / Sukoon", text: "mujhe aaj thoda peaceful music sunna hai" },
    { label: "⚡ Gym & Workout", text: "I need energetic songs for gym" },
    { label: "🥹 Missing old days", text: "I miss old memories and nostalgic times" },
    { label: "🔥 Need motivation", text: "feeling low need strong motivation to hustle" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSearchText(inputText.trim());
    }
  };

  const handleChipClick = (promptText) => {
    setInputText(promptText);
    onSearchText(promptText);
  };

  return (
    <div className="relative pt-8 pb-16 px-4 max-w-5xl mx-auto text-center">
      {/* Subtle Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-purple-600/20 via-pink-600/20 to-sky-600/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-purple-300 mb-6 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span>NLP & TF-IDF Bollywood Mood Engine</span>
      </div>

      {/* Main Headline */}
      <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
        Music that matches <br />
        <span className="gradient-text">your mood.</span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
        Tell us how you feel. We'll find the Bollywood songs that fit using natural language processing and lyrical sentiment analysis.
      </p>

      {/* Natural Language Mood Search Bar */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
        <div className="relative flex items-center p-2 rounded-2xl glass-panel shadow-2xl shadow-purple-900/20 border border-white/15 focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
          <div className="pl-3 pr-2 text-gray-400">
            <Wand2 className="w-5 h-5 text-pink-400" />
          </div>

          <input
            id="mood-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="How are you feeling today? (e.g. mujhe aaj thoda peaceful sunna hai)"
            className="w-full bg-transparent text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none px-2 py-2"
            disabled={isLoading}
          />

          <button
            id="find-my-music-btn"
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Find My Music</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mb-14">
        <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
          Try saying:
        </span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(prompt.text)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Quick Mood Cards Directly Below */}
      <div className="border-t border-white/10 pt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
          Or Select a Mood Directly
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-5xl mx-auto">
          {moods && moods.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMood(m.id)}
              className="group flex flex-col items-center justify-center p-3.5 rounded-xl glass-card hover:bg-white/10 transition-all text-center cursor-pointer border border-white/10 hover:border-pink-500/50"
            >
              <span className="text-3xl mb-1.5 group-hover:scale-125 transition-transform">
                {m.emoji}
              </span>
              <span className="text-xs font-bold text-white group-hover:text-pink-300">
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
