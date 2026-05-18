import React from 'react';
import { motion } from 'framer-motion';
import { moods } from '../data/database';

const MoodSelector = ({ selectedMood, onSelectMood }) => {
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      
      <div className="mood-grid" style={{ marginBottom: '2rem' }}>
        {moods.map((mood, index) => (
          <motion.div
            key={mood.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`mood-card ${selectedMood?.id === mood.id ? 'active' : ''}`}
            onClick={() => onSelectMood(mood)}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
