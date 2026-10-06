import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack,
  X, Heart, Bookmark, Radio, Minimize2, Volume2,
} from 'lucide-react';

// Send YT iframe API commands via postMessage
function ytCmd(iframe, func, args = []) {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args }), '*'
    );
  } catch (_) {}
}

function fmt(s) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const FALLBACK_DURATION = 240;
const ORIGIN = encodeURIComponent(window.location.origin || 'http://localhost:5173');

export default function PlayerBar({
  currentTrack, isPlaying, setIsPlaying,
  onNext, onPrev, onClose, onFeedback, feedbackState = {},
}) {
  const [showVideo, setShowVideo]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [isDragging, setIsDragging]   = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  const iframeRef = useRef(null);
  const pollRef   = useRef(null);
  const barRef    = useRef(null);
  const elapsed   = useRef(0);
  const trackIdRef = useRef(null);

  // 1. Reset on track change
  useEffect(() => {
    if (!currentTrack) return;
    elapsed.current = 0;
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIframeReady(false);
    trackIdRef.current = currentTrack.id;
    // Small delay then play
    const t = setTimeout(() => {
      ytCmd(iframeRef.current, 'unMute');
      ytCmd(iframeRef.current, 'setVolume', [100]);
      ytCmd(iframeRef.current, 'playVideo');
      setIsPlaying?.(true);
    }, 800);
    return () => clearTimeout(t);
  }, [currentTrack?.id]);

  // 2. Play / Pause command
  useEffect(() => {
    if (!currentTrack || !iframeReady) return;
    ytCmd(iframeRef.current, isPlaying ? 'playVideo' : 'pauseVideo');
  }, [isPlaying]);

  // 3. Poll elapsed time (fallback when postMessage doesn't fire)
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!currentTrack || !isPlaying || isDragging) return;
    pollRef.current = setInterval(() => {
      elapsed.current += 0.5;
      setCurrentTime(elapsed.current);
      const d = duration > 0 ? duration : FALLBACK_DURATION;
      setProgress(Math.min(99.5, (elapsed.current / d) * 100));
    }, 500);
    return () => clearInterval(pollRef.current);
  }, [currentTrack, isPlaying, isDragging, duration]);

  // 4. YouTube postMessage events
  useEffect(() => {
    if (!currentTrack) return;
    const handler = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;

        // Player ready
        if (data.event === 'onReady' || data.info?.playerState != null) {
          setIframeReady(true);
        }

        if (data.info?.duration > 0) {
          setDuration(data.info.duration);
        }
        if (data.info?.currentTime != null && !isDragging) {
          elapsed.current = data.info.currentTime;
          setCurrentTime(data.info.currentTime);
          if (data.info.duration > 0) {
            setProgress(Math.min(100, (data.info.currentTime / data.info.duration) * 100));
          }
        }
        // playerState: 0=ended, 1=playing, 2=paused
        if (data.info?.playerState === 0) onNext?.();
        if (data.info?.playerState === 1) setIsPlaying?.(true);
        if (data.info?.playerState === 2) setIsPlaying?.(false);
      } catch (_) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [currentTrack, isDragging, onNext, setIsPlaying]);

  // 5. Seek handler
  const seek = useCallback((e) => {
    const bar = barRef.current;
    if (!bar) return;
    const d = duration > 0 ? duration : FALLBACK_DURATION;
    const { left, width } = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - left) / width));
    const t = ratio * d;
    elapsed.current = t;
    setCurrentTime(t);
    setProgress(ratio * 100);
    ytCmd(iframeRef.current, 'seekTo', [t, true]);
  }, [duration]);

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying?.(next);
    ytCmd(iframeRef.current, next ? 'playVideo' : 'pauseVideo');
  };

  // ONLY AFTER ALL HOOKS HAVE RUN:
  if (!currentTrack) return null;

  const isLiked = feedbackState[currentTrack.id] === 'like';
  const isSaved = feedbackState[currentTrack.id] === 'save';
  const ytId = currentTrack.youtube_id || 'dQw4w9WgXcQ';

  // IMPORTANT: origin must match, autoplay=1, mute=1 to satisfy browser autoplay policy,
  // enablejsapi=1 for postMessage control
  const src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=0&enablejsapi=1&playsinline=1&rel=0&origin=${ORIGIN}&controls=0`;

  return (
    <>
      {/* ── YouTube iframe: always mounted, sized properly ── */}
      {/* Hidden visually when not in video mode, but never 0-size or offscreen */}
      {/* (Browsers block autoplay on invisible/tiny iframes) */}
      <div
        style={showVideo ? {} : { position: 'fixed', bottom: '-320px', right: '16px', width: '320px', height: '180px', opacity: 0, pointerEvents: 'none', zIndex: 1 }}
        className={showVideo
          ? 'fixed bottom-24 right-4 z-50 w-80 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#0d0f18]'
          : ''}
      >
        {/* Video header (only shown when video is visible) */}
        {showVideo && (
          <div className="flex items-center justify-between px-3 py-2 bg-black/80 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0" />
              <span className="text-xs font-semibold text-white truncate">{currentTrack.music_name}</span>
            </div>
            <button
              onClick={() => setShowVideo(false)}
              className="text-gray-400 hover:text-white cursor-pointer ml-2 shrink-0 p-1"
              title="Minimize Video"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div style={{ width: '100%', height: showVideo ? undefined : '180px' }} className={showVideo ? 'aspect-video bg-black' : ''}>
          <iframe
            key={ytId}
            ref={iframeRef}
            src={src}
            title={currentTrack.music_name}
            style={{ width: '100%', height: '100%', border: 'none', minHeight: '180px' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* ── Player Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-5xl mx-auto px-4 pb-3 pointer-events-auto">
          <div
            style={
              isPlaying
                ? {
                    boxShadow: '0 12px 36px -10px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                    borderColor: 'rgba(255,255,255,0.18)',
                  }
                : {}
            }
            className="bg-[#0f1320]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
          >

            {/* Progress bar */}
            <div
              ref={barRef}
              className="relative h-1.5 bg-white/10 cursor-pointer group transition-all hover:h-2"
              onMouseDown={(e) => { setIsDragging(true); seek(e); }}
              onMouseMove={(e) => { if (isDragging) seek(e); }}
              onMouseUp={(e)   => { if (isDragging) { seek(e); setIsDragging(false); } }}
              onMouseLeave={()  => isDragging && setIsDragging(false)}
              title="Click to seek"
            >
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                style={{ width: `${progress}%`, transition: isDragging ? 'none' : 'width 0.4s linear' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* 3-column layout */}
            <div className="grid grid-cols-3 items-center gap-2 px-4 py-2.5">

              {/* LEFT – thumbnail + track info */}
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.music_name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 shadow"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200'; }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">{currentTrack.music_name}</p>
                  <p className="text-[11px] text-gray-400 truncate leading-tight">{currentTrack.singer}</p>
                </div>
              </div>

              {/* CENTER – playback controls */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <button onClick={onPrev} className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer" title="Previous">
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying
                      ? <Pause className="w-4 h-4 fill-white text-white" />
                      : <Play  className="w-4 h-4 fill-white text-white ml-0.5" />}
                  </button>

                  <button onClick={onNext} className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer" title="Next">
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                  {fmt(currentTime)} / {duration > 0 ? fmt(duration) : fmt(FALLBACK_DURATION)}
                </span>
              </div>

              {/* RIGHT – actions */}
              <div className="flex items-center justify-end gap-1">
                {/* EQ animation */}
                {isPlaying && (
                  <div className="flex items-end gap-px h-3.5 mr-2">
                    <span className="w-0.5 bg-pink-400 rounded-sm eq-bar-1" />
                    <span className="w-0.5 bg-purple-400 rounded-sm eq-bar-2" />
                    <span className="w-0.5 bg-sky-400 rounded-sm eq-bar-3" />
                    <span className="w-0.5 bg-pink-400 rounded-sm eq-bar-4" />
                  </div>
                )}

                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className={`p-2 rounded-lg transition cursor-pointer ${showVideo ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title={showVideo ? 'Hide Video' : 'Watch Video'}
                >
                  <Radio className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onFeedback(currentTrack.id, 'like')}
                  className={`p-2 rounded-lg transition cursor-pointer ${isLiked ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="Like"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
                </button>

                <button
                  onClick={() => onFeedback(currentTrack.id, 'save')}
                  className={`p-2 rounded-lg transition cursor-pointer ${isSaved ? 'text-purple-400 bg-purple-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="Save"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-purple-400 text-purple-400' : ''}`} />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition cursor-pointer" title="Close Player">
                  <X className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
