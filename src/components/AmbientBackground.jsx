import React, { useEffect, useRef, useState, useMemo } from 'react';

// Mood-based BPM (Beats Per Minute) rhythm anchors
const MOOD_BPM = {
  Energetic: 128,
  Happy: 118,
  Motivational: 124,
  Romantic: 86,
  Nostalgic: 92,
  Sad: 72,
  Calm: 64,
  Default: 108,
};

// Base mood color palettes (Vibrant HSL & HEX)
const BASE_MOOD_PALETTES = {
  Romantic: [
    { c1: '#ec4899', c2: '#9333ea', c3: '#f43f5e', c4: '#fb7185' },
    { c1: '#e11d48', c2: '#be185d', c3: '#7c3aed', c4: '#f472b6' },
  ],
  Happy: [
    { c1: '#f59e0b', c2: '#ef4444', c3: '#eab308', c4: '#fb923c' },
    { c1: '#f97316', c2: '#e11d48', c3: '#facc15', c4: '#fde047' },
  ],
  Sad: [
    { c1: '#3b82f6', c2: '#1d4ed8', c3: '#6366f1', c4: '#38bdf8' },
    { c1: '#1e3a8a', c2: '#4338ca', c3: '#0284c7', c4: '#818cf8' },
  ],
  Calm: [
    { c1: '#10b981', c2: '#06b6d4', c3: '#14b8a6', c4: '#34d399' },
    { c1: '#059669', c2: '#0891b2', c3: '#10b981', c4: '#2dd4bf' },
  ],
  Energetic: [
    { c1: '#8b5cf6', c2: '#06b6d4', c3: '#d946ef', c4: '#f43f5e' },
    { c1: '#7c3aed', c2: '#0284c7', c3: '#ec4899', c4: '#a855f7' },
  ],
  Motivational: [
    { c1: '#ef4444', c2: '#f97316', c3: '#a855f7', c4: '#fbbf24' },
    { c1: '#dc2626', c2: '#ea580c', c3: '#9333ea', c4: '#f87171' },
  ],
  Nostalgic: [
    { c1: '#d97706', c2: '#b45309', c3: '#e11d48', c4: '#f59e0b' },
    { c1: '#b45309', c2: '#9f1239', c3: '#ca8a04', c4: '#fde68a' },
  ],
  Default: [
    { c1: '#ec4899', c2: '#8b5cf6', c3: '#06b6d4', c4: '#3b82f6' },
    { c1: '#a855f7', c2: '#f43f5e', c3: '#0ea5e9', c4: '#d946ef' },
  ],
};

function getTrackColorPalette(track) {
  if (!track) return { ...BASE_MOOD_PALETTES.Default[0], hueShift: 0, bpm: 108 };

  const moodKey = track.primary_mood || 'Default';
  const palettes = BASE_MOOD_PALETTES[moodKey] || BASE_MOOD_PALETTES.Default;
  const bpm = MOOD_BPM[moodKey] || 108;

  const str = (track.music_name || '') + (track.singer || '') + (track.id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % palettes.length;
  const base = palettes[idx];
  const hueShift = (Math.abs(hash) % 40) - 20;

  return {
    ...base,
    hueShift,
    bpm,
    trackId: track.id,
    title: track.music_name,
  };
}

export default function AmbientBackground({ currentTrack, isPlaying }) {
  const canvasRef = useRef(null);
  const prevTrackIdRef = useRef(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [liveBeat, setLiveBeat] = useState(false);

  // Compute active palette and BPM
  const palette = useMemo(() => {
    return getTrackColorPalette(currentTrack);
  }, [currentTrack]);

  // Track change trigger
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentTrack.id;
      setPulseKey((k) => k + 1);
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stardust floating particles
    const particleCount = 50;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.0 + 0.6,
        baseSpeedX: (Math.random() - 0.5) * 0.45,
        baseSpeedY: (Math.random() - 0.5) * 0.45,
        alpha: Math.random() * 0.55 + 0.25,
      });
    }

    // Dynamic Beat Ripples & Shockwaves
    const beatRipples = [];
    const bpm = palette.bpm || 108;
    const beatInterval = 60 / bpm; // seconds per beat

    let lastBeatTime = performance.now() / 1000;
    let beatCount = 0;
    let beatEnergy = 0; // 0 to 1 decay
    let beatHueRotate = 0;
    let lastFrameTime = performance.now() / 1000;

    const render = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(0.1, now - lastFrameTime);
      lastFrameTime = now;

      // ── Beat Detection Engine ──
      if (isPlaying) {
        if (now - lastBeatTime >= beatInterval) {
          lastBeatTime = now;
          beatCount++;
          beatEnergy = 1.0;

          // Every beat shifts the ambient color hue by 15-25 degrees!
          beatHueRotate = (beatHueRotate + 22) % 360;

          // Add a luminous expanding beat ripple on bass downbeats (every 2 beats)
          if (beatCount % 2 === 0) {
            beatRipples.push({
              x: width * 0.5,
              y: height * 0.5,
              radius: 10,
              maxRadius: Math.max(width, height) * 0.8,
              speed: 8 + (bpm / 12),
              alpha: 0.4,
              color: palette.c1,
            });
          }

          // Trigger UI beat indicator briefly
          setLiveBeat(true);
          setTimeout(() => setLiveBeat(false), 90);
        } else {
          // Smooth exponential decay of beat energy
          beatEnergy = Math.max(0, beatEnergy - dt * 3.2);
        }
      } else {
        beatEnergy = 0;
      }

      // Update Live CSS Variables for the entire page to pulse with the beat!
      const currentScale = 1 + beatEnergy * 0.16;
      const currentGlow = 0.22 + beatEnergy * 0.28;
      document.documentElement.style.setProperty('--beat-scale', `${currentScale}`);
      document.documentElement.style.setProperty('--beat-glow', `${currentGlow}`);
      document.documentElement.style.setProperty('--beat-hue-rotate', `${beatHueRotate}deg`);
      document.documentElement.style.setProperty('--beat-accent', palette.c1);

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Expanding Beat Ripples (Shockwaves)
      for (let i = beatRipples.length - 1; i >= 0; i--) {
        const r = beatRipples[i];
        r.radius += r.speed;
        r.alpha *= 0.965;

        if (r.radius < r.maxRadius && r.alpha > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.35})`;
          ctx.lineWidth = 2.5 + beatEnergy * 2;
          ctx.shadowBlur = 25 * beatEnergy;
          ctx.shadowColor = palette.c2;
          ctx.stroke();
          ctx.restore();
        } else {
          beatRipples.splice(i, 1);
        }
      }

      // 2. Draw Floating Beat-Reactive Stardust Particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        const beatBoost = isPlaying ? 1 + beatEnergy * 2.5 : 0.8;
        p.x += p.baseSpeedX * beatBoost;
        p.y += p.baseSpeedY * beatBoost;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const pulse = 0.75 + beatEnergy * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha * pulse * 0.5)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, palette]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">

      {/* ── Beat-Reactive Dynamic Aurora Orbs (Colors shift on every beat!) ── */}
      <div
        className="absolute top-[-12%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[140px] ambient-orb-1"
        style={{
          background: palette.c1,
          filter: `hue-rotate(calc(${palette.hueShift}deg + var(--beat-hue-rotate))) blur(140px)`,
          transform: `scale(var(--beat-scale)) translate(20px, -20px)`,
          opacity: `var(--beat-glow)`,
          transition: 'background 1.2s ease, opacity 0.08s ease-out, transform 0.08s ease-out',
        }}
      />

      <div
        className="absolute top-[20%] right-[-10%] w-[740px] h-[740px] rounded-full blur-[160px] ambient-orb-2"
        style={{
          background: palette.c2,
          filter: `hue-rotate(calc(${-palette.hueShift}deg + var(--beat-hue-rotate))) blur(160px)`,
          transform: `scale(var(--beat-scale)) translate(-25px, 20px)`,
          opacity: `var(--beat-glow)`,
          transition: 'background 1.2s ease, opacity 0.08s ease-out, transform 0.08s ease-out',
        }}
      />

      <div
        className="absolute bottom-[-15%] left-[20%] w-[840px] h-[640px] rounded-full blur-[170px]"
        style={{
          background: palette.c3,
          filter: `hue-rotate(var(--beat-hue-rotate)) blur(170px)`,
          transform: `scale(var(--beat-scale))`,
          opacity: `calc(var(--beat-glow) * 0.85)`,
          transition: 'background 1.2s ease, opacity 0.08s ease-out, transform 0.08s ease-out',
        }}
      />

      <div
        className="absolute top-[45%] left-[38%] w-[520px] h-[520px] rounded-full blur-[180px]"
        style={{
          background: palette.c4 || palette.c1,
          filter: `hue-rotate(calc(45deg + var(--beat-hue-rotate))) blur(180px)`,
          transform: `scale(var(--beat-scale))`,
          opacity: `calc(var(--beat-glow) * 0.7)`,
          transition: 'background 1.2s ease, opacity 0.08s ease-out, transform 0.08s ease-out',
        }}
      />

      {/* ── Dynamic Beat Kick Flash Overlay ── */}
      {isPlaying && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-75"
          style={{
            background: `radial-gradient(circle at 50% 50%, var(--beat-accent) 0%, transparent 75%)`,
            opacity: liveBeat ? 0.08 : 0.015,
          }}
        />
      )}

      {/* ── Song Switch Shockwave Flash ── */}
      <div
        key={pulseKey}
        className="absolute inset-0 opacity-0 animate-in fade-in zoom-in duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 60%, ${palette.c1}25 0%, transparent 70%)`,
        }}
      />

      {/* ── Canvas Layer (Beat Shockwaves & Stardust Particles) ── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />

      {/* ── Subtle Floating Beat-Sync Indicator (Top-Right) ── */}
      {isPlaying && (
        <div className="absolute top-20 right-5 z-20 hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-gray-300 shadow-lg pointer-events-none">
          <span
            className="w-2 h-2 rounded-full transition-transform duration-75"
            style={{
              background: 'var(--beat-accent)',
              transform: liveBeat ? 'scale(1.5)' : 'scale(1)',
              boxShadow: liveBeat ? '0 0 10px var(--beat-accent)' : 'none',
            }}
          />
          <span className="font-mono tracking-wider font-semibold uppercase">
            Beat Sync: {palette.bpm} BPM
          </span>
        </div>
      )}
    </div>
  );
}
