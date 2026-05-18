const fs = require('fs');
const data = JSON.parse(fs.readFileSync('spotifyData.json'));

const moods = ['trending', 'party', 'romantic', 'sad', 'chill', 'workout', 'devotional', 'focus'];
const moodMap = {};

// Distribute data evenly to moods
for (let i = 0; i < data.length; i++) {
  const m = moods[i % moods.length];
  if (!moodMap[m]) moodMap[m] = [];
  moodMap[m].push(data[i]);
}

let out = `
export const moods = [
  { id: 'trending', label: 'Trending', emoji: '📈', theme: 'trending' },
  { id: 'party', label: 'Party', emoji: '🎉', theme: 'energetic' },
  { id: 'romantic', label: 'Romantic', emoji: '❤️', theme: 'romantic' },
  { id: 'sad', label: 'Sad', emoji: '💔', theme: 'sad' },
  { id: 'chill', label: 'Chill & Relax', emoji: '☕', theme: 'sad' },
  { id: 'workout', label: 'Workout', emoji: '💪', theme: 'energetic' },
  { id: 'devotional', label: 'Devotional', emoji: '🙏', theme: 'romantic' },
  { id: 'focus', label: 'Focus & Study', emoji: '📚', theme: 'trending' },
];

const songData = ${JSON.stringify(moodMap, null, 2)};

export const getSongs = (moodId) => {
  const songs = songData[moodId] || songData['trending'];
  // Return the songs, adding a fake duration and unique ID
  return songs.map((s, index) => ({
    id: moodId + '-' + index,
    title: s.title,
    artist: s.artist || 'Various Artists',
    thumbnail: s.thumbnail,
    spotifyId: s.id,
    duration: '3:2' + (index % 10)
  }));
};
`;

fs.writeFileSync('src/data/database.js', out);
