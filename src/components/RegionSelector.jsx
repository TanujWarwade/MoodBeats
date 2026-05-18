import React from 'react';
import { motion } from 'framer-motion';
import { regions } from '../data/database';

const RegionSelector = ({ selectedRegion, onSelectRegion }) => {
  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
        Step 1: Choose Your Vibe's Origin
      </h2>
      <div className="mood-grid">
        {regions.map((region, index) => (
          <motion.div
            key={region.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`mood-card region-card ${selectedRegion?.id === region.id ? 'active' : ''}`}
            onClick={() => onSelectRegion(region)}
            style={{ padding: '1rem' }}
          >
            <span className="mood-emoji" style={{ fontSize: '1.8rem' }}>{region.emoji}</span>
            <span className="mood-label" style={{ fontSize: '0.9rem' }}>{region.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RegionSelector;
