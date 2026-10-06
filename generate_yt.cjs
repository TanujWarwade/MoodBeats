const fs = require('fs');

const ytDatabase = {
  trending: [
    { id: 'VAdGW7QDJiU', title: 'Chaleya (Jawan)', artist: 'Arijit Singh, Shilpa Rao', duration: '3:20' },
    { id: 'cbmlCJo8A7o', title: 'Apna Bana Le', artist: 'Arijit Singh', duration: '4:21' },
    { id: 'Umqb9KENgWE', title: 'Tum Hi Ho', artist: 'Arijit Singh', duration: '4:22' },
    { id: 'YxWlaYCA8MU', title: 'Jhoome Jo Pathaan', artist: 'Arijit Singh', duration: '3:28' },
    { id: 'BddP6PYo2gs', title: 'Kesariya', artist: 'Arijit Singh', duration: '4:28' },
    { id: '8nK1MCRA0k4', title: 'O Maahi', artist: 'Arijit Singh', duration: '3:53' }
  ],
  party: [
    { id: 'VNs_cCtdbPc', title: 'Brown Munde', artist: 'AP Dhillon', duration: '4:27' },
    { id: 'fB8XmB-Qj_o', title: 'Zingaat', artist: 'Ajay-Atul', duration: '3:46' },
    { id: 'k4yXQkG2s1E', title: 'Kala Chashma', artist: 'Badshah, Neha Kakkar', duration: '3:07' },
    { id: 'OqRydx_2Q8M', title: 'Lutt Putt Gaya', artist: 'Arijit Singh', duration: '3:44' },
    { id: 'NTHz9ephYMc', title: 'Kar Gayi Chull', artist: 'Badshah', duration: '3:07' },
    { id: 'hHuG7FIKgtc', title: 'Aankh Marey', artist: 'Neha Kakkar, Mika Singh', duration: '3:33' }
  ],
  sad: [
    { id: 'bzSTpdcs-EI', title: 'Channa Mereya', artist: 'Arijit Singh', duration: '4:49' },
    { id: 'jHNNMj5bNQw', title: 'Kabira', artist: 'Tochi Raina, Rekha Bhardwaj', duration: '3:43' },
    { id: 'sK7riqg2mrA', title: 'Agar Tum Saath Ho', artist: 'Alka Yagnik, Arijit Singh', duration: '5:41' },
    { id: 'MJyKN-8UncM', title: 'Shayad', artist: 'Arijit Singh', duration: '4:07' },
    { id: 'tVj0ZTS4WF4', title: 'Kal Ho Naa Ho', artist: 'Sonu Nigam', duration: '5:27' },
    { id: 'LkaKWX3tB3k', title: 'Tujhe Bhula Diya', artist: 'Mohit Chauhan', duration: '4:39' }
  ],
  romantic: [
    { id: 'z2IQxV1u5-w', title: 'Raabta', artist: 'Arijit Singh', duration: '4:04' },
    { id: '5EQrwV0t1sY', title: 'Pehli Nazar Mein', artist: 'Atif Aslam', duration: '5:13' },
    { id: 'v7K4vGYL9zI', title: 'Tujh Mein Rab Dikhta Hai', artist: 'Roop Kumar Rathod', duration: '4:41' },
    { id: 'pElk1Sh_w8E', title: 'Gerua', artist: 'Arijit Singh, Antara Mitra', duration: '5:45' },
    { id: 'z1g_S0DudYc', title: 'Tere Sang Yaara', artist: 'Atif Aslam', duration: '4:50' },
    { id: 'uf7GInx5k-0', title: 'Enna Sona', artist: 'Arijit Singh', duration: '3:33' }
  ]
};

const finalDatabase = {};

for (const [mood, songs] of Object.entries(ytDatabase)) {
  finalDatabase[mood] = songs.map(s => ({
    id: `yt-${s.id}`,
    spotifyId: s.id, // Keeping same key name for compatibility
    title: s.title,
    artist: s.artist,
    thumbnail: `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`,
    duration: s.duration
  }));
}

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
  const data = songData[moodId];
  if (data && data.length > 0) return data;
  
  if (moodId === 'chill' || moodId === 'focus') return songData['sad'] || songData['trending'];
  if (moodId === 'workout') return songData['party'] || songData['trending'];
  if (moodId === 'devotional') return songData['romantic'] || songData['trending'];
  
  return songData['trending'];
};
`;

fs.writeFileSync('src/data/database.js', dbCode);
console.log('YouTube Database generated successfully!');
