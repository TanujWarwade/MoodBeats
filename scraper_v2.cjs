const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const moodPlaylists = {
  trending: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFmNBRM', // Top Songs India
  party: 'https://open.spotify.com/playlist/37i9dQZF1DWZq91oLsHZvy',    // Bollywood Dance
  romantic: 'https://open.spotify.com/playlist/37i9dQZF1DX5q67ZpWyRrZ', // Bollywood Mush
  sad: 'https://open.spotify.com/playlist/37i9dQZF1DWV7EzJMK2FUI',      // Sad Bollywood
  chill: 'https://open.spotify.com/playlist/37i9dQZF1DXa2PwS2Sik1x',    // Chill Tracks India
  workout: 'https://open.spotify.com/playlist/37i9dQZF1DX8jPEroG2z5E',  // Bollywood Workout
  devotional: 'https://open.spotify.com/playlist/37i9dQZF1DWZq91oLsHZvy', // Reusing dance if devotion fails, actually let's use a real one: 37i9dQZF1DWZ5QeGhBceW3
  focus: 'https://open.spotify.com/playlist/37i9dQZF1DWZ0h2A8EebnK'     // Focus India
};

// Fixing Devotional
moodPlaylists.devotional = 'https://open.spotify.com/playlist/37i9dQZF1DWZ5QeGhBceW3';

async function fetchOembed(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://open.spotify.com/oembed?url=spotify:track:${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const finalDatabase = {};

  for (const [mood, url] of Object.entries(moodPlaylists)) {
    console.log(`Fetching playlist for ${mood}...`);
    try {
      // Use powershell to fetch HTML because native https requires handling redirects/cookies
      const command = `powershell -Command "$r = Invoke-WebRequest -Uri '${url}' -UseBasicParsing; $r.Content"`;
      const html = execSync(command, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
      
      // Extract IDs
      const regex = /spotify:track:([a-zA-Z0-9]{22})/g;
      const matches = [...html.matchAll(regex)];
      const ids = [...new Set(matches.map(m => m[1]))].slice(0, 20); // 20 songs per vibe

      console.log(`Found ${ids.length} tracks for ${mood}. Fetching metadata...`);
      
      finalDatabase[mood] = [];
      for (const id of ids) {
        try {
          const data = await fetchOembed(id);
          finalDatabase[mood].push({
            id: `${mood}-${id}`,
            spotifyId: id,
            title: data.title,
            artist: data.author_name,
            thumbnail: data.thumbnail_url,
            duration: '3:30' // Placeholder
          });
        } catch(e) {
          // ignore
        }
      }
    } catch(e) {
      console.error(`Failed to process ${mood}`);
    }
  }

  // Generate database.js
  const dbCode = `
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

const songData = ${JSON.stringify(finalDatabase, null, 2)};

export const getSongs = (moodId) => {
  return songData[moodId] || songData['trending'];
};
`;

  fs.writeFileSync('src/data/database.js', dbCode);
  console.log('Database generated successfully!');
}

run();
