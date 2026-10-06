import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DiscoverView from './components/DiscoverView';
import SongModal from './components/SongModal';
import PlayerBar from './components/PlayerBar';
import NotificationToast from './components/NotificationToast';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';
import LibraryModal from './components/LibraryModal';

import {
  fetchMoods,
  getSimilarSongs,
  getSongDetails,
  sendFeedback,
  DEFAULT_MOODS,
} from './services/api';

export default function App() {
  const [moods, setMoods] = useState(DEFAULT_MOODS);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const [selectedSong, setSelectedSong] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [toast, setToast] = useState(null);

  // User Authentication & Library Modals
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('moodbeats_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  useEffect(() => {
    fetchMoods()
      .then((data) => {
        if (data && data.moods) setMoods(data.moods);
      })
      .catch((err) => console.error('Error fetching moods:', err));
  }, []);

  // Handle In-Web Playback
  const handlePlay = (song, songList = []) => {
    if (songList && songList.length > 0) {
      setPlaylist(songList);
    }
    setCurrentPlayingTrack(song);
    setIsPlaying(true);
    showToast(`Playing on web: ${song.music_name}`, 'success');
    sendFeedback(song.id, 'play', user?.id || 'demo-user').catch(console.error);
  };

  // Next Track in playlist
  const handleNext = () => {
    if (!playlist || playlist.length === 0 || !currentPlayingTrack) return;
    const curIdx = playlist.findIndex((s) => s.id === currentPlayingTrack.id);
    const nextIdx = (curIdx + 1) % playlist.length;
    handlePlay(playlist[nextIdx], playlist);
  };

  // Prev Track in playlist
  const handlePrev = () => {
    if (!playlist || playlist.length === 0 || !currentPlayingTrack) return;
    const curIdx = playlist.findIndex((s) => s.id === currentPlayingTrack.id);
    const prevIdx = (curIdx - 1 + playlist.length) % playlist.length;
    handlePlay(playlist[prevIdx], playlist);
  };

  // Feedback action (like / dislike / save)
  const handleFeedback = async (songId, action) => {
    setFeedbackState((prev) => ({ ...prev, [songId]: action }));

    const msgs = {
      like: 'Added to Liked Songs ❤️',
      save: 'Saved to Library 🔖',
      dislike: 'Disliked track',
      play: 'Playing track 🎵',
    };
    if (msgs[action]) {
      showToast(msgs[action], action === 'like' ? 'like' : action === 'save' ? 'save' : 'info');
    }

    try {
      await sendFeedback(songId, action, user?.id || 'demo-user');
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  // Song details modal
  const handleShowDetails = async (song) => {
    setSelectedSong(song);
    try {
      const data = await getSongDetails(song.id);
      if (data && data.success) {
        setSelectedSong(data.song);
      }
    } catch (err) {
      console.error('Song details fetch error:', err);
    }
  };

  // More like this
  const handleMoreLikeThis = async (songId, songTitle) => {
    try {
      const data = await getSimilarSongs(songId, 15);
      if (data && data.success && data.recommendations?.length > 0) {
        setPlaylist(data.recommendations);
        showToast(`Loaded tracks similar to "${songTitle}"`, 'info');
      }
    } catch (err) {
      console.error('Similar songs error:', err);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('moodbeats_user', JSON.stringify(authenticatedUser));
    showToast(`Welcome to MoodBeats, ${authenticatedUser.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('moodbeats_user');
    setUser(null);
    showToast('Signed out of MoodBeats', 'info');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0b10] text-gray-100 flex flex-col selection:bg-pink-500 selection:text-white pb-24 relative overflow-x-hidden">

        {/* Toast Notification */}
        {toast && (
          <NotificationToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Clean MoodBeats Navbar */}
        <Navbar
          currentTrack={currentPlayingTrack}
          isPlaying={isPlaying}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenLibrary={() => setIsLibraryOpen(true)}
        />

        {/* Main View: Discover Page & Mood Explorer */}
        <main className="flex-1">
          <DiscoverView
            moods={moods}
            onPlay={handlePlay}
            currentPlayingTrack={currentPlayingTrack}
            isPlaying={isPlaying}
            onFeedback={handleFeedback}
            onMoreLikeThis={handleMoreLikeThis}
            onShowDetails={handleShowDetails}
            feedbackState={feedbackState}
          />
        </main>

        {/* Auth Modal / Login */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Library Modal */}
        <LibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          user={user || { id: 'demo-user', name: 'Demo User' }}
          onPlay={handlePlay}
          currentPlayingTrack={currentPlayingTrack}
          isPlaying={isPlaying}
        />

        {/* Song Details Modal */}
        {selectedSong && (
          <SongModal
            song={selectedSong}
            onClose={() => setSelectedSong(null)}
            onPlay={(s) => handlePlay(s, playlist)}
            onFeedback={handleFeedback}
            onMoreLikeThis={handleMoreLikeThis}
            feedbackState={feedbackState}
          />
        )}

        {/* Bottom Music & Video Player */}
        <PlayerBar
          currentTrack={currentPlayingTrack}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => {
            setIsPlaying(false);
            setCurrentPlayingTrack(null);
          }}
          onFeedback={handleFeedback}
          feedbackState={feedbackState}
        />
      </div>
    </ErrorBoundary>
  );
}
