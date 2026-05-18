const fs = require('fs');
const https = require('https');

const trackIds = [
  "0OLTYqD8FpjkLsxJmdWmgi", "2PNAKNrINLMHHrk5iMKNzA", "0WbMK4wrZ1wFSty9F7FCgu", "5r5cp9IpziiIsR6b93vcnQ",
  "3ZZyUf7WkhfN1JkQZZ00fI", "0ntQJM78wzOLVeCUAW7Y45", "7EkWXAI1wn8Ii883ecd9xr", "6MrLkXsMmHaYt680fhJUAq",
  "3GZD6HmiNUhxXYf8Gch723", "3VD30P9pXZq2usG4tSdjBa", "6QgjcU0zLnzq5OrUoSZ3OK", "7yT4NJt5rgmVoMJMGPULcj",
  "0GO8y8jQk1PkHzS31d699N", "1xtGpjlpfU9ILjlxUa7UHl", "19kHhX6f6EfLU7rcO3RqjO", "1FrmEoNfKBx7Z6nU05KW5w",
  "2J051fjLklkoPbzOoTAACZ", "5773KSWFzg9kCc8yazjbSt", "2GxrNKugF82CnoRFbQfzPf", "57Xjny5yNzAcsxnusKmAfA",
  "2O9O26335YYVckmRgPKY3s", "3HlK8txWAdtKMrbsqX40pl", "7d23MhPFE9eB3U8DPRirnL", "4JHg4nNYUJQ5HULcCmI18R",
  "6WTFHKrnZpwEBLRS10Ylqs", "7srqyRb5plksW5k65itXDB", "53IRnAWx13PYmoVYtemUBS", "6qZjm61s6u8Ead9sWxCDro",
  "1eyzqe2QqGZUmfcPZtrIyt", "5xoUgPXbMNUmoHU0Enwtwq", "3n69hLUdIsSa1WlRmjMZlW", "7hGCCQkdyF1MX6uk339uBS",
  "0XgRWgcs0Pcr9PSIdFWD4N", "6VBhH7CyP56BXjp8VsDFPZ", "6FAYpZ4jve8vpvTwUvjK6H", "6YZxrJsE14C7bfyQGFJqqm"
];

async function fetchOembed(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://open.spotify.com/oembed?url=spotify:track:${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const results = [];
  for(let id of trackIds) {
    try {
      const data = await fetchOembed(id);
      results.push({
        id: id,
        title: data.title,
        artist: data.author_name,
        thumbnail: data.thumbnail_url
      });
      console.log('Fetched:', data.title);
    } catch(e) {
      console.error('Failed:', id);
    }
  }
  fs.writeFileSync('spotifyData.json', JSON.stringify(results, null, 2));
}

run();
