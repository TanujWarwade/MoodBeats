import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import ReactPlayer from 'react-player';
import { getSongs } from '../data/database';

const TrackList = ({ mood }) => {
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);

  // Reset playing track when mood changes
  useEffect(() => {
    setPlayingTrackId(null);
    setIsPlaying(false);
    setProgress(0);
  }, [mood]);

  if (!mood) {
    return (
      <div className="empty-state" style={{ marginTop: '4rem' }}>
        <Music size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Select your vibe</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Choose a feeling or mood to load your 100% original track list!</p>
      </div>
    );
  }

  const currentSongs = getSongs(mood.id);
  
  // Find the currently active song and its index
  const activeIndex = playingTrackId 
    ? currentSongs.findIndex(s => s.spotifyId === playingTrackId) 
    : 0;
  const activeSong = currentSongs[activeIndex];
  const activeTrackId = activeSong?.spotifyId;

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % currentSongs.length;
    setPlayingTrackId(currentSongs[nextIndex].spotifyId);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + currentSongs.length) % currentSongs.length;
    setPlayingTrackId(currentSongs[prevIndex].spotifyId);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    if (!playingTrackId && activeTrackId) {
      setPlayingTrackId(activeTrackId);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const seekTo = parseFloat(e.target.value);
    setProgress(seekTo);
    if (playerRef.current) {
      playerRef.current.seekTo(seekTo);
    }
  };

  const videoUrl = activeTrackId ? `https://www.youtube.com/watch?v=${activeTrackId}` : '';

  return (
    <div className="playlist-container" style={{ paddingBottom: '160px' }}>
      
      {/* Spotify style playlist header */}
      <div className="playlist-header-spotify">
        <div className="playlist-cover" style={{ overflow: 'hidden', padding: 0 }}>
          {playingTrackId ? (
            <img 
              src={activeSong.thumbnail} 
              alt="Now Playing" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <span style={{ fontSize: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {mood.emoji}
            </span>
          )}
        </div>
        <div className="playlist-meta">
          <p style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>PLAYLIST</p>
          <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', fontWeight: '800', lineHeight: '1.1' }}>
            {mood.label} Vibes
          </h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-color)' }}>Aura Beats</span> • 
            {currentSongs.length} songs, original curation
          </p>
        </div>
      </div>
      
      <div className="song-list-section" style={{ padding: '0 2rem' }}>
        <div className="song-list-header">
          <div className="col-index">#</div>
          <div className="col-title">Title</div>
          <div className="col-album">Mood</div>
          <div className="col-duration"><Clock size={16} /></div>
        </div>

        <div className="song-list">
          {currentSongs.map((song, index) => (
            <div 
              key={song.id}
              className={`song-list-item ${activeTrackId === song.spotifyId ? 'active' : ''}`}
              onClick={() => {
                setPlayingTrackId(song.spotifyId);
                setIsPlaying(true);
              }}
            >
              <div className="col-index">
                <span className="index-number">{index + 1}</span>
                {activeTrackId === song.spotifyId && isPlaying ? (
                  <Pause className="play-icon" size={14} fill="currentColor" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} />
                ) : (
                  <Play className="play-icon" size={14} fill="currentColor" />
                )}
              </div>
              <div className="col-title">
                <img src={song.thumbnail} alt={song.title} className="list-thumbnail" />
                <div className="list-song-info">
                  <div className="list-song-name">{song.title}</div>
                  <div className="list-song-artist">{song.artist}</div>
                </div>
              </div>
              <div className="col-album">{mood.label}</div>
              <div className="col-duration">{song.duration}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Custom Audio Player UI (Spotify Clone) */}
      {playingTrackId && (
        <div className="spotify-bottom-player" style={{ 
          height: '90px', 
          padding: '0 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: '#181818',
          borderTop: '1px solid #282828',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 1000
        }}>
          
          {/* Left: Song Info & Hidden YouTube Player */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '30%', maxWidth: '30%' }}>
            {/* Thumbnail Container containing the Hidden Player */}
            <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
              
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                playing={isPlaying}
                width="56px"
                height="56px"
                onProgress={(e) => setProgress(e.played)}
                onEnded={handleNext}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                config={{
                  youtube: {
                    playerVars: { autoplay: 1, controls: 0, playsinline: 1 }
                  }
                }}
              />
              <img src={activeSong.thumbnail} alt="Poster" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                {activeSong.title}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '0.6875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                {activeSong.artist}
              </div>
            </div>
          </div>

          {/* Center: Controls & Seekbar */}
          <div style={{ flex: 1, maxWidth: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <SkipBack size={20} style={{ cursor: 'pointer', color: '#b3b3b3' }} onClick={handlePrev} />
              
              <div 
                onClick={handlePlayPause}
                style={{ background: '#fff', color: '#000', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />}
              </div>

              <SkipForward size={20} style={{ cursor: 'pointer', color: '#b3b3b3' }} onClick={handleNext} />
            </div>

            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.6875rem', color: '#b3b3b3', minWidth: '35px', textAlign: 'right' }}>
                0:00
              </span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.001" 
                value={progress} 
                onChange={handleSeek}
                style={{ flex: 1, cursor: 'pointer', height: '4px', accentColor: '#1db954', background: '#535353', borderRadius: '2px', outline: 'none' }}
              />
              <span style={{ fontSize: '0.6875rem', color: '#b3b3b3', minWidth: '35px' }}>
                {activeSong.duration || '3:30'}
              </span>
            </div>
          </div>

          {/* Right: Spacer to match Spotify layout */}
          <div style={{ minWidth: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', paddingRight: '16px' }}>
             {/* Volume control placeholder to look authentic */}
             <div style={{ width: '100px', height: '4px', background: '#535353', borderRadius: '2px' }}>
               <div style={{ width: '60%', height: '100%', background: '#b3b3b3', borderRadius: '2px' }}></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackList;
