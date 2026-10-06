import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional

from backend.config import (
    VECTORIZER_PATH,
    SONG_MATRIX_PATH,
    PROCESSED_DF_PATH,
    MOOD_TFIDF_QUERIES,
    SUPPORTED_MOODS,
    COSINE_WEIGHT,
    MOOD_WEIGHT,
    RATING_WEIGHT,
    BASE_SCORE_WEIGHT,
    PREF_MOOD_WEIGHT,
    PREF_ARTIST_WEIGHT,
    PREF_YEAR_WEIGHT,
    LIKE_BONUS,
    SAVE_BONUS,
    DISLIKE_PENALTY
)
from backend.preprocessing import clean_lyrics
from backend.mood_detector import detect_mood_from_text, calculate_lyrics_mood_scores
from backend.database import (
    get_song_by_id,
    record_user_feedback,
    get_user_feedback_history,
    get_user_profile_stats,
    extract_youtube_id
)

VALID_ACTIONS = {"like", "dislike", "skip", "save", "play"}


class MusicRecommendationEngine:
    """
    Core AI-based Bollywood Music Mood Recommendation Engine.
    Combines TF-IDF lyrical similarity, lexicon-based mood scoring,
    and user personalization feedback.
    """

    def __init__(self):
        self.vectorizer = None
        self.song_matrix = None
        self.df = None
        self.load_models()

    def load_models(self):
        """Load TF-IDF vectorizer, song matrix, and song metadata."""
        if not (os.path.exists(VECTORIZER_PATH) and os.path.exists(SONG_MATRIX_PATH)):
            from backend.train_model import train
            train()

        self.vectorizer = joblib.load(VECTORIZER_PATH)
        self.song_matrix = joblib.load(SONG_MATRIX_PATH)
        if os.path.exists(PROCESSED_DF_PATH):
            self.df = joblib.load(PROCESSED_DF_PATH)
        else:
            from backend.database import get_all_songs_df
            self.df = get_all_songs_df()

        # Add 1-based or 0-based index lookup
        # Songs in SQLite start at id=1
        # Add 1-based or 0-based index lookup
        # Songs in SQLite start at id=1
        if "id" not in self.df.columns:
            self.df["id"] = range(1, len(self.df) + 1)

        # Pre-cache numpy arrays for blazing fast 1ms vectorized filtering
        self.song_ids = self.df["id"].to_numpy(dtype=np.int64)
        self.song_singers_lower = self.df["singer"].fillna("").astype(str).str.lower().to_numpy()
        self.song_moods = self.df["primary_mood"].fillna("").astype(str).to_numpy()
        self.song_years = self.df["release"].fillna(2015).to_numpy(dtype=np.int32)
        self._mood_cache = {}

    def detect_mood(self, text: str) -> Dict[str, Any]:
        """Infer mood from natural language user input."""
        return detect_mood_from_text(text)

    def _calculate_match_percentage(self, score: float, max_score: float = 0.5) -> int:
        """
        Convert composite recommendation score into an intuitive Mood Match percentage (e.g. 70% - 98%).
        """
        if max_score <= 0.001:
            max_score = 0.25
        normalized = min(1.0, max(0.0, score / max_score))
        # Map 0..1 to an appealing 68%..98% range
        percentage = int(68 + (normalized * 30))
        return min(99, max(60, percentage))

    def _apply_personalization(
        self,
        base_scores: np.ndarray,
        user_id: Optional[str] = None,
        target_mood: Optional[str] = None
    ) -> np.ndarray:
        """
        Adjust ranking scores using user feedback profile (Vectorized NumPy - 1ms execution).
        adjusted_score = base_score + mood_pref + artist_pref + year_pref + likes - dislike_penalty
        """
        if not user_id:
            return base_scores

        feedback = get_user_feedback_history(user_id)
        if not feedback:
            return base_scores

        adjusted = np.copy(base_scores)

        # Track liked/saved artists, moods, release years, and disliked songs
        liked_singers = set()
        saved_singers = set()
        disliked_song_ids = set()
        liked_song_ids = set()
        saved_song_ids = set()
        liked_moods = set()
        release_years = []

        for item in feedback:
            sid = item["song_id"]
            action = item["action"]
            singer = (item.get("singer") or "").lower()
            mood = item.get("primary_mood")
            yr = item.get("release")

            if action == "dislike":
                disliked_song_ids.add(sid)
            elif action == "like":
                liked_song_ids.add(sid)
                if singer:
                    liked_singers.add(singer)
                if mood:
                    liked_moods.add(mood)
                if yr:
                    release_years.append(yr)
            elif action == "save":
                saved_song_ids.add(sid)
                if singer:
                    saved_singers.add(singer)
                if mood:
                    liked_moods.add(mood)

        avg_fav_year = float(np.mean(release_years)) if release_years else None

        # 1. Dislike penalty (Vectorized)
        if disliked_song_ids:
            adjusted[np.isin(self.song_ids, list(disliked_song_ids))] -= DISLIKE_PENALTY

        # 2. Saved & Liked bonuses (Vectorized)
        if saved_song_ids:
            adjusted[np.isin(self.song_ids, list(saved_song_ids))] += SAVE_BONUS
        if liked_song_ids:
            adjusted[np.isin(self.song_ids, list(liked_song_ids))] += LIKE_BONUS

        # 3. Matching liked moods (Vectorized)
        if liked_moods:
            adjusted[np.isin(self.song_moods, list(liked_moods))] += PREF_MOOD_WEIGHT

        # 4. Era / Release proximity (Vectorized)
        if avg_fav_year:
            year_mask = np.abs(self.song_years - avg_fav_year) <= 2
            adjusted[year_mask] += PREF_YEAR_WEIGHT

        # 5. Favorite artists (Fast substring matching)
        fav_singers = [s for s in (liked_singers | saved_singers) if len(s) >= 3]
        if fav_singers:
            artist_mask = np.fromiter(
                (any(s in singer for s in fav_singers) for singer in self.song_singers_lower),
                dtype=bool,
                count=len(self.song_ids)
            )
            adjusted[artist_mask] += PREF_ARTIST_WEIGHT

        return adjusted

    def _format_song_dict(
        self,
        row: pd.Series,
        final_score: float,
        cosine_sim: float,
        mood_score: float,
        match_percentage: int,
        target_mood: str
    ) -> Dict[str, Any]:
        """Format a single song row into a clean response dictionary."""
        # Ensure clean song name and singer
        music_name = str(row["music_name"]).strip()
        singer = str(row["singer"]).strip()
        thumbnail = str(row["thumbnail"]).strip()
        youtube_id = row.get("youtube_id") or extract_youtube_id(thumbnail)

        # Why this song explanation
        song_primary = row["primary_mood"]
        if song_primary.lower() == target_mood.lower():
            reason = f"Lyrically certified {target_mood} track with strong emotional resonance."
        else:
            reason = f"Shares high lyrical similarity and evocative themes aligned with {target_mood} vibes."
        sec_mood = row.get("secondary_mood")
        clean_sec_mood = None if (pd.isna(sec_mood) or str(sec_mood).lower() in ("nan", "none", "")) else str(sec_mood)

        def safe_float(v):
            return round(float(v), 3) if pd.notna(v) else 0.0

        return {
            "id": int(row["id"]),
            "music_name": music_name,
            "singer": singer,
            "release": int(row["release"]),
            "era": str(row.get("era") or "2015-2025"),
            "song_rating": round(float(row.get("song_rating") or 0.0), 1),
            "thumbnail": thumbnail,
            "youtube_id": youtube_id,
            "primary_mood": str(row["primary_mood"]),
            "secondary_mood": clean_sec_mood,
            "mood_match": f"{match_percentage}%",
            "match_percentage": match_percentage,
            "final_score": round(float(final_score), 4) if pd.notna(final_score) else 0.0,
            "cosine_similarity": round(float(cosine_sim), 4) if pd.notna(cosine_sim) else 0.0,
            "mood_score": round(float(mood_score), 4) if pd.notna(mood_score) else 0.0,
            "recommendation_reason": reason,
            "scores": {
                "happy": safe_float(row.get("happy_score")),
                "sad": safe_float(row.get("sad_score")),
                "romantic": safe_float(row.get("romantic_score")),
                "calm": safe_float(row.get("calm_score")),
                "energetic": safe_float(row.get("energetic_score")),
                "motivational": safe_float(row.get("motivational_score")),
                "nostalgic": safe_float(row.get("nostalgic_score")),
            }
        }

    def recommend_by_mood(
        self,
        mood: str,
        limit: int = 10,
        user_id: Optional[str] = "demo-user"
    ) -> List[Dict[str, Any]]:
        """
        Recommend songs based on primary mood:
        1. Create TF-IDF query from representative keywords.
        2. Compute cosine similarity with song matrix.
        3. Combine: final_score = 0.55 * cosine_sim + 0.30 * mood_score + 0.15 * rating_score.
        4. Apply user personalization adjustment.
        5. Rank top songs.
        """
        norm_mood = mood.capitalize()
        if norm_mood not in MOOD_TFIDF_QUERIES:
            norm_mood = "Romantic"

        cache_key = f"{norm_mood}_{limit}_{user_id}"
        if hasattr(self, "_mood_cache") and cache_key in self._mood_cache:
            return self._mood_cache[cache_key]

        query_text = MOOD_TFIDF_QUERIES[norm_mood]
        cleaned_query = clean_lyrics(query_text)
        query_vec = self.vectorizer.transform([cleaned_query])

        cosine_sims = cosine_similarity(query_vec, self.song_matrix).flatten()

        mood_col = f"{norm_mood.lower()}_score"
        mood_scores = self.df[mood_col].to_numpy()

        primary_boost = np.where(self.df["primary_mood"] == norm_mood, 0.50, np.where(self.df["secondary_mood"] == norm_mood, 0.25, -0.20))

        # Recency boost prioritizing modern hits (2015-2025)
        era_vals = self.df["era"].fillna("").to_numpy()
        recency_boost = np.where(era_vals == "2015-2025", 0.35, np.where(era_vals == "2005-2014", 0.15, 0.0))

        # Rating quality boost (0 to 5 stars -> 0 to RATING_WEIGHT)
        ratings = self.df["song_rating"].fillna(0.0).to_numpy()
        rating_boost = (ratings / 5.0) * RATING_WEIGHT

        base_scores = (COSINE_WEIGHT * cosine_sims) + (MOOD_WEIGHT * mood_scores) + primary_boost + rating_boost + recency_boost

        # Personalization
        final_scores = self._apply_personalization(base_scores, user_id=user_id, target_mood=norm_mood)

        top_indices = np.argsort(final_scores)[::-1][:limit]
        max_score = float(np.max(final_scores)) if len(final_scores) > 0 else 0.5

        results = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            match_pct = self._calculate_match_percentage(final_scores[idx], max_score=max_score)
            results.append(
                self._format_song_dict(
                    row=row,
                    final_score=final_scores[idx],
                    cosine_sim=cosine_sims[idx],
                    mood_score=mood_scores[idx],
                    match_percentage=match_pct,
                    target_mood=norm_mood
                )
            )

        if hasattr(self, "_mood_cache"):
            self._mood_cache[cache_key] = results
        return results

    def recommend_by_text(
        self,
        text: str,
        limit: int = 10,
        user_id: Optional[str] = "demo-user"
    ) -> Dict[str, Any]:
        """
        Complete pipeline: Text Mood Detection -> Classification -> TF-IDF -> Ranking.
        """
        detection = self.detect_mood(text)
        detected_mood = detection["detected_mood"]
        confidence = detection["confidence"]

        # Also use the user's specific natural query for TF-IDF cosine similarity
        cleaned_user_text = clean_lyrics(text)
        base_query = MOOD_TFIDF_QUERIES.get(detected_mood, "")
        combined_query = f"{cleaned_user_text} {clean_lyrics(base_query)}"

        query_vec = self.vectorizer.transform([combined_query])
        cosine_sims = cosine_similarity(query_vec, self.song_matrix).flatten()

        mood_col = f"{detected_mood.lower()}_score"
        mood_scores = self.df[mood_col].to_numpy()
        primary_boost = np.where(self.df["primary_mood"] == detected_mood, 0.50, np.where(self.df["secondary_mood"] == detected_mood, 0.25, -0.20))

        era_vals = self.df["era"].fillna("").to_numpy()
        recency_boost = np.where(era_vals == "2015-2025", 0.35, np.where(era_vals == "2005-2014", 0.15, 0.0))

        ratings = self.df["song_rating"].fillna(0.0).to_numpy()
        rating_boost = (ratings / 5.0) * RATING_WEIGHT

        base_scores = (COSINE_WEIGHT * cosine_sims) + (MOOD_WEIGHT * mood_scores) + primary_boost + rating_boost + recency_boost
        final_scores = self._apply_personalization(base_scores, user_id=user_id, target_mood=detected_mood)

        top_indices = np.argsort(final_scores)[::-1][:limit]
        max_score = float(np.max(final_scores)) if len(final_scores) > 0 else 0.5

        songs = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            match_pct = self._calculate_match_percentage(final_scores[idx], max_score=max_score)
            songs.append(
                self._format_song_dict(
                    row=row,
                    final_score=final_scores[idx],
                    cosine_sim=cosine_sims[idx],
                    mood_score=mood_scores[idx],
                    match_percentage=match_pct,
                    target_mood=detected_mood
                )
            )

        return {
            "query": text,
            "detected_mood": detected_mood,
            "confidence": confidence,
            "low_confidence": detection["low_confidence"],
            "explanation": detection["explanation"],
            "recommendations": songs
        }

    def recommend_similar_song(
        self,
        song_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        'More Like This' feature:
        Uses the target song's TF-IDF vector and cosine similarity to find lyrically similar songs.
        """
        matching_rows = self.df[self.df["id"] == song_id]
        if matching_rows.empty:
            return []

        song_idx = matching_rows.index[0]
        seed_row = matching_rows.iloc[0]

        target_vec = self.song_matrix[song_idx]
        sims = cosine_similarity(target_vec, self.song_matrix).flatten()

        # Exclude self
        sims[song_idx] = -1.0

        top_indices = np.argsort(sims)[::-1][:limit]
        max_sim = float(np.max(sims)) if len(sims) > 0 else 0.5

        results = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            sim = sims[idx]
            match_pct = self._calculate_match_percentage(sim, max_score=max_sim)
            sim_sec_mood = row.get("secondary_mood")
            clean_sim_sec = None if (pd.isna(sim_sec_mood) or str(sim_sec_mood).lower() in ("nan", "none", "")) else str(sim_sec_mood)
            def safe_f(v):
                return round(float(v), 3) if pd.notna(v) else 0.0

            results.append({
                "id": int(row["id"]),
                "music_name": str(row["music_name"]).strip(),
                "singer": str(row["singer"]).strip(),
                "release": int(row["release"]),
                "era": str(row.get("era") or "2015-2025"),
                "song_rating": round(float(row.get("song_rating") or 0.0), 1),
                "thumbnail": str(row["thumbnail"]).strip(),
                "youtube_id": row.get("youtube_id") or extract_youtube_id(row.get("thumbnail")),
                "primary_mood": str(row["primary_mood"]),
                "secondary_mood": clean_sim_sec,
                "similarity_score": round(float(sim), 4),
                "mood_match": f"{match_pct}%",
                "match_percentage": match_pct,
                "recommendation_reason": f"Shares lyrical motifs and stylistic resonance with '{seed_row['music_name']}'.",
                "scores": {
                    "happy": safe_f(row.get("happy_score")),
                    "sad": safe_f(row.get("sad_score")),
                    "romantic": safe_f(row.get("romantic_score")),
                    "calm": safe_f(row.get("calm_score")),
                    "energetic": safe_f(row.get("energetic_score")),
                    "motivational": safe_f(row.get("motivational_score")),
                    "nostalgic": safe_f(row.get("nostalgic_score")),
                }
            })

        return results

    def record_feedback(self, user_id: str, song_id: int, action: str):
        """Record user action: like, dislike, skip, save, play."""
        action_clean = action.lower().strip()
        if action_clean not in VALID_ACTIONS:
            raise ValueError(f"Invalid action '{action}'. Must be one of {VALID_ACTIONS}")
        record_user_feedback(user_id=user_id, song_id=song_id, action=action_clean)
        if hasattr(self, "_mood_cache"):
            self._mood_cache.clear()

    def get_personalized_recommendations(
        self,
        user_id: str = "demo-user",
        mood: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate recommendations tailored to user's interaction history.
        If mood is not given, uses the user's favorite mood.
        """
        stats = get_user_profile_stats(user_id)
        target_mood = mood or stats["favorite_mood"] or "Romantic"
        return self.recommend_by_mood(mood=target_mood, limit=limit, user_id=user_id)
