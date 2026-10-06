# 🎵 MoodBeats — AI Bollywood Music Mood Recommendation

> An end-to-end, production-ready AI/ML web application recommending Bollywood songs based on user mood and lyrical sentiment using NLP, TF-IDF vectorization, and cosine similarity with interactive in-web playback.

---

## 1. Project Overview

**MoodBeats** is an AI-powered music recommendation platform tailored specifically for Bollywood music. Unlike generic music apps that rely exclusively on static genres or audio-feature proxies (such as acousticness or danceability), MoodBeats directly parses, cleans, and scores Hindi/Hinglish lyrics alongside English sentiment lexicons to infer the emotional essence of songs.

The system features an all-in-one Discover and In-Web Playback dashboard where users can search by song name, singer, release year, or natural language mood descriptions (e.g., *"mujhe aaj thoda peaceful music sunna hai"* or *"I need energetic songs for gym"*), and immediately listen to songs directly on the web application.

---

## 2. Problem Statement

Most modern music recommendation systems (like Spotify or Apple Music) rely heavily on proprietary audio signal features (valence, tempo, acousticness) or collaborative filtering from millions of user profiles. However:
- Specialized regional music corpora, such as Bollywood tracks, often lack comprehensive audio feature metadata.
- Bollywood songs are emotionally driven by poetic lyricism (shayari, Hinglish emotional vocabulary, metaphors like *dard*, *sukoon*, *khushi*, *ishq*, *yaadein*).
- Users frequently experience emotional states that are best articulated in colloquial or natural language phrases rather than rigid genre tags.

**MoodBeats bridges this gap** by converting raw lyrics into mathematical feature vectors and emotional sentiment distributions, delivering transparent, lyrical-driven mood recommendations that run completely offline or on local servers.

---

## 3. Features

- **In-Web Audio & Video Playback**: Seamless playback directly on the website via integrated embedded stream without navigating away.
- **Natural Language Mood Detection**: Detects user emotion from English, Hindi, and Hinglish phrases with confidence scoring.
- **7 Primary Mood Categories**:
  - 😄 **Happy**: Joyful, celebratory, and upbeat party tracks.
  - 😢 **Sad**: Heartfelt, emotional, and melancholy melodies.
  - ❤️ **Romantic**: Passionate love ballads and soul-stirring romance.
  - 😌 **Calm**: Peaceful, relaxing, and acoustic sukoon melodies.
  - ⚡ **Energetic**: High-octane dance numbers and gym anthems.
  - 🔥 **Motivational**: Inspiring songs of perseverance and ambition.
  - 🥹 **Nostalgic**: Melodies of childhood, old memories, and bygone days.
- **7-Mood Score Breakdown**: Detailed visual percentage breakdown for every track.
- **Multi-Field Filters & Search**: Search by title, singer, lyrics; filter by mood, artist, or release year (2017–2023).
- **Sorting Options**: Sort by newest, oldest, alphabetical, or mood match score.
- **More Like This (TF-IDF Similarity)**: 1-click discovery of lyrically similar Bollywood songs.
- **User Feedback & Personalization**: Real-time Likes, Saves, Dislikes, and Plays that dynamically influence song rankings.

---

## 4. Dataset

The system utilizes the verified Bollywood dataset:

- **Filename**: `Bollywood-Songs-Dataset(2017-23).csv`
- **Total Songs**: 974 Bollywood songs (2017 to 2023)
- **Columns**:
  - `music_name`: Song title (e.g. *Ek Haseena Thi Ek Deewana Tha*, *Tum Hi Ho*, *Kesariya*)
  - `singer`: Singer/Artist credits (e.g. *Arijit Singh*, *Palak Muchhal*, *Yasser Desai*)
  - `release`: Release year (2017–2023)
  - `lyrics`: Full lyrics in romanized Hindi / Hinglish and English
  - `thumbnail`: Official YouTube thumbnail URL containing valid video IDs (e.g., `https://i.ytimg.com/vi/6obiArkHwAk/hqdefault.jpg`)

*Note: All 974 songs have verified thumbnails and extracted YouTube video IDs (`youtube_id`), enabling 100% native in-web playback.*

---

## 5. Machine Learning Approach

The machine learning pipeline combines three complementary scoring components:

1. **Lyrical Lexicon Mood Scoring**: Normalized keyword frequency using curated emotional lexicons across the 7 primary moods.
2. **TF-IDF Vector Space Representation**: Sublinear term-frequency inverse document frequency matrix over unigrams and bigrams.
3. **Cosine Similarity**: Vector angle comparison between the user's mood query vector and the pre-computed 974 song vectors.
4. **Hybrid Rank Aggregator**:
   $$\text{Final Score} = 0.70 \times \text{Cosine Similarity} + 0.30 \times \text{Mood Score} + \text{Primary Boost}$$
5. **Personalization Adjustment**: Dynamic score adjustments based on user's liked singers, moods, and saved tracks.

---

## 6. NLP Preprocessing Pipeline

Every lyrics field undergoes a strict 12-step cleaning process in [`backend/preprocessing.py`](file:///d:/Antigravity/Music%20Mood/backend/preprocessing.py):

1. **Lowercase Conversion**: Standardizes text representation.
2. **URL Removal**: Strips `http://`, `https://`, and `www.` patterns.
3. **HTML Stripping**: Removes `<...>` tags and web artifacts.
4. **Punctuation & Special Character Removal**: Preserves alphanumeric characters and spaces.
5. **Whitespace Normalization**: Eliminates tabs, newlines, and duplicate spaces.
6. **Tokenization**: Splits text into word tokens.
7. **Stopword Filtering**: Removes generic English stopwords (`the`, `is`, `at`, `which`).
8. **Emotional Word Preservation**: Crucially prevents emotional words (`love`, `cry`, `alone`, `happy`, `pain`, `dream`, `peace`, `fire`) from being dropped as stopwords.
9. **Hinglish Preservation**: Leaves romanized Hindi words (`khushi`, `sukoon`, `yaadein`, `dard`, `pyaar`) completely intact.
10. **Rule-Based Morphological Lemmatization**: Reduces inflectional variations (`smiling` $\to$ `smile`, `crying` $\to$ `cry`, `memories` $\to$ `memory`).
11. **Null/Empty Handling**: Fallback mechanisms for missing fields.
12. **Non-destructive Storage**: Stores results in `clean_lyrics` while preserving original `lyrics`.

---

## 7. Mood Detection

### Natural Language Mood Classification
Users can type natural expressions in English, Hindi, or Hinglish:
- *"I am feeling very sad today"* $\to$ **Sad** (Confidence: 95%)
- *"mujhe aaj thoda peaceful music sunna hai"* $\to$ **Calm** (Confidence: 95%)
- *"I need energetic songs for gym"* $\to$ **Energetic** (Confidence: 95%)
- *"purani yaadein taaza karni hain"* $\to$ **Nostalgic** (Confidence: 94%)

The algorithm computes phrase matches (+3.5 pts), lexicon matches (+1.2 pts), and direct mentions (+4.0 pts), normalizing into a probability distribution and confidence score. If confidence is below 60%, a low-confidence banner allows 1-click manual mood adjustments.

---

## 8. TF-IDF Model

Configured using Scikit-Learn's `TfidfVectorizer`:
- **Vocabulary Limit**: `max_features = 5000`
- **N-gram Range**: `(1, 2)` (captures single words and two-word poetic phrases)
- **Document Frequency**: `min_df = 2`, `max_df = 0.95`
- **Sublinear TF**: `sublinear_tf = True` (applies logarithmic scaling $1 + \log(\text{tf})$ to prevent repetitive choruses from dominating).

Model artifacts are persisted in `backend/models/`:
- `tfidf_vectorizer.pkl`
- `song_matrix.pkl`
- `processed_songs.pkl`

---

## 9. Cosine Similarity

The similarity between a mood query vector $\vec{q}$ and a song vector $\vec{d}_i$ is defined as the cosine of the angle between them:

$$\text{Cosine Similarity}(\vec{q}, \vec{d}_i) = \frac{\vec{q} \cdot \vec{d}_i}{\|\vec{q}\|_2 \|\vec{d}_i\|_2}$$

Because TF-IDF vectors are L2-normalized, this simplifies to the efficient dot product:
$$\text{sim}(\vec{q}, \vec{d}_i) = \vec{q} \cdot \vec{d}_i$$

---

## 10. Recommendation Engine Architecture

Implemented as the clean, modular Python class [`MusicRecommendationEngine`](file:///d:/Antigravity/Music%20Mood/backend/recommender.py):

```python
class MusicRecommendationEngine:
    def detect_mood(self, text: str) -> dict
    def recommend_by_mood(self, mood: str, limit: int = 10, user_id: str = "demo-user") -> list
    def recommend_by_text(self, text: str, limit: int = 10, user_id: str = "demo-user") -> dict
    def recommend_similar_song(self, song_id: int, limit: int = 10) -> list
    def record_feedback(self, user_id: str, song_id: int, action: str) -> None
    def get_personalized_recommendations(self, user_id: str, mood: str = None, limit: int = 10) -> list
```

---

## 11. Personalization & Feedback Loop

The user feedback system records four action types in SQLite:
- `like`: Adds $+0.15$ score bonus; weights the singer and primary mood for future rankings.
- `save`: Adds $+0.20$ score bonus to bookmark favorites.
- `dislike`: Imposes a $-0.50$ penalty, demoting the song and similar tracks.
- `play`: Automatically increments play counts and records interaction timestamps.

Adjusted ranking formula:
$$\text{Rank Score} = \text{Base Score} + \text{Mood Pref} + \text{Artist Pref} + \text{Era Pref} + \text{Like Bonus} - \text{Dislike Penalty}$$

---

## 12. Project Structure

```text
Music Mood/
├── backend/
│   ├── app.py               # Flask REST API server (Port 5000)
│   ├── config.py            # Hyperparameters, mood lexicon, and file paths
│   ├── database.py          # SQLite database schema, queries, and feedback
│   ├── mood_detector.py     # NLP intent parser and lyrics scoring
│   ├── preprocessing.py     # 12-step lyrics text cleaning pipeline
│   ├── recommender.py       # MusicRecommendationEngine core class
│   ├── train_model.py       # Model training and evaluation script
│   ├── data/
│   │   ├── Bollywood-Songs-Dataset(2017-23).csv  # 974 songs
│   │   └── music_mood.db                         # SQLite database
│   ├── models/
│   │   ├── tfidf_vectorizer.pkl
│   │   ├── song_matrix.pkl
│   │   └── processed_songs.pkl
│   └── requirements.txt     # Python dependencies
│
├── src/
│   ├── components/
│   │   ├── DiscoverView.jsx # All-in-one search, mood pills, and song browser
│   │   ├── Navbar.jsx       # Header with live playing indicator & stats
│   │   ├── PlayerBar.jsx    # In-web bottom audio/video player
│   │   ├── SongCard.jsx     # Song card with instant web playback & info
│   │   ├── SongModal.jsx    # 7-mood visual breakdown modal
│   │   └── NotificationToast.jsx
│   ├── services/
│   │   └── api.js           # REST API client
│   ├── App.jsx              # Main React application
│   ├── index.css            # Dark mode glassmorphism styles
│   └── main.jsx
│
├── index.html               # Web HTML entry
├── vite.config.js           # Vite dev server with Tailwind v4 & API proxy
└── package.json             # Frontend dependencies
```

---

## 13. Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Install Frontend Dependencies
```bash
npm install
```

---

## 14. Running Backend

Train the model and start the Flask API:

```bash
# 1. Train the TF-IDF model and populate database (run once)
python backend/train_model.py

# 2. Start Flask REST API server
python backend/app.py
```
*Backend runs on `http://127.0.0.1:5000`.*

---

## 15. Running Frontend

In a separate terminal:

```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

Open your browser to `http://localhost:5173` to explore songs and listen directly on the web app.

---

## 16. API Documentation

| Method | Endpoint | Description | Sample Payload / Params |
|---|---|---|---|
| `GET` | `/api/health` | Service health check | None |
| `GET` | `/api/moods` | Retrieve 7 supported moods & metadata | None |
| `POST` | `/api/detect-mood` | Classify natural language text | `{"text": "feeling sad today"}` |
| `POST` | `/api/recommend` | Mood-based song playlist | `{"mood": "Happy", "limit": 10}` |
| `POST` | `/api/recommend/text` | Text prompt recommendation | `{"text": "peaceful songs", "limit": 10}` |
| `GET` | `/api/song/<id>` | Full song info with 7 mood scores | `GET /api/song/12` |
| `GET` | `/api/song/<id>/similar` | TF-IDF lyrical similarity | `GET /api/song/12/similar?limit=10` |
| `POST` | `/api/feedback` | Record user interaction | `{"user_id": "demo-user", "song_id": 12, "action": "like"}` |
| `GET` | `/api/discover` | Multi-field search, filter, and sort | `?query=Arijit&mood=Romantic&year=2021&sort_by=newest` |
| `GET` | `/api/user/profile` | Dynamic user music personality stats | `?user_id=demo-user` |

---

## 17. Future Improvements

1. **Audio Feature Integration**: Incorporate acoustic features (tempo, valence, energy) using a hybrid model:
   $$\text{Final} = w_1 \times \text{LyricsSim} + w_2 \times \text{AudioSim} + w_3 \times \text{MoodScore}$$
2. **Transformer Embeddings**: Experiment with multilingual BERT / RoBERTa for deep contextual semantics in Hinglish poetry.
3. **Collaborative Filtering**: Incorporate matrix factorization (SVD / ALS) as the user base expands.
4. **Spotify Web Playback SDK**: Direct Spotify premium streaming alongside YouTube in-web playback.

---

## 18. Screenshots & User Experience

- **Discover & Instant Player**: Clean dark glassmorphic dashboard showcasing 974 Bollywood tracks with live in-web playback controls.
- **Mood Tag Filtering**: 1-click pills for 😄 Happy, 😢 Sad, ❤️ Romantic, 😌 Calm, ⚡ Energetic, 🔥 Motivational, and 🥹 Nostalgic.
- **7-Mood Score Breakdown**: Detailed visual horizontal bars showing exact sentiment distributions for every track.
- **Persistent Bottom Player**: Embedded in-web stream with play/pause, next/prev, audio wave visualizer, and expandable video player.

---

*Built with ❤️ for Indian Cinema & Bollywood Music enthusiasts.*
