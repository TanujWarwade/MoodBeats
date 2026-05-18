import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import MoodSelector from './components/MoodSelector';
import TrackList from './components/TrackList';
import './index.css';

function App() {
  const [selectedMood, setSelectedMood] = useState(null);

  // Update theme dynamically based on mood selection
  useEffect(() => {
    if (selectedMood) {
      document.body.setAttribute('data-theme', selectedMood.theme);
      document.documentElement.style.setProperty('--intensity-opacity', '0.7');
    } else {
      document.body.removeAttribute('data-theme');
      document.documentElement.style.setProperty('--intensity-opacity', '1');
    }
  }, [selectedMood]);

  return (
    <div className="spotify-layout no-sidebar">
      {/* Main Content Area */}
      <main className="main-view">
        <header className="main-header" style={{ paddingTop: '2rem' }}>
          <div className="header-bg-overlay"></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Music size={36} color="var(--accent-color)" />
            <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Aura Beats</h1>
          </div>

          <h2>Discover Your Vibe</h2>
          <p>Select your mood and feeling to generate an authentic playlist.</p>
          
          <div className="selectors-row">
            <div className="selector-wrapper">
              <MoodSelector 
                selectedMood={selectedMood} 
                onSelectMood={setSelectedMood}
              />
            </div>
          </div>
        </header>

        <section className="playlist-content">
          <TrackList 
            mood={selectedMood} 
          />
        </section>
      </main>
    </div>
  );
}

export default App;
