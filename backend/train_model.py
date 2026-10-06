import os
import sys
import pandas as pd
import numpy as np
import joblib

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.config import (
    CSV_PATH_LEGACY,
    CSV_PATH_1995_2004,
    CSV_PATH_2005_2014,
    CSV_PATH_2015_2025,
    MODELS_DIR,
    VECTORIZER_PATH,
    SONG_MATRIX_PATH,
    PROCESSED_DF_PATH,
    TFIDF_MAX_FEATURES,
    TFIDF_NGRAM_RANGE,
    TFIDF_MIN_DF,
    TFIDF_MAX_DF,
    TFIDF_SUBLINEAR_TF,
    SUPPORTED_MOODS,
    MOOD_TFIDF_QUERIES
)
from backend.preprocessing import clean_lyrics
from backend.mood_detector import calculate_lyrics_mood_scores
from backend.database import init_db, save_songs, extract_youtube_id


def train():
    print("=" * 65)
    print("🎵 MoodBeats — Full 30-Year Bollywood ML Training Pipeline (1995–2025)")
    print("=" * 65)

    all_records = []
    seen_yt_ids = set()

    # 1. Load legacy dataset (has full lyrics for 974 songs)
    lyrics_cache = {}
    if os.path.exists(CSV_PATH_LEGACY):
        print(f"\nLoading lyrics cache from {os.path.basename(CSV_PATH_LEGACY)}...")
        df_legacy = pd.read_csv(CSV_PATH_LEGACY)
        for _, r in df_legacy.iterrows():
            thumb = str(r.get("thumbnail", ""))
            yt_id = extract_youtube_id(thumb)
            title = str(r.get("music_name", "")).strip()
            lyr = str(r.get("lyrics", "")).strip()
            if lyr:
                lyrics_cache[title.lower()] = lyr
                if yt_id:
                    lyrics_cache[yt_id] = lyr
            
            if yt_id and yt_id not in seen_yt_ids:
                seen_yt_ids.add(yt_id)
                rel_yr = int(r["release"]) if pd.notna(r.get("release")) else 2020
                era = "2015-2025" if rel_yr >= 2015 else ("2005-2014" if rel_yr >= 2005 else "1995-2004")
                all_records.append({
                    "music_name": title,
                    "singer": str(r.get("singer", "Various Artists")).strip(),
                    "release": rel_yr,
                    "era": era,
                    "lyrics": lyr,
                    "thumbnail": thumb,
                    "youtube_id": yt_id,
                    "song_rating": 4.2,  # Curated set baseline rating
                })
        print(f"✓ Cached {len(lyrics_cache)} lyric references.")

    # 2. Ingest 3 Era CSV files (2015-2025 first for modern hits priority, 2005-2014, 1995-2004)
    era_files = [
        ("2015-2025", CSV_PATH_2015_2025, 2022),
        ("2005-2014", CSV_PATH_2005_2014, 2010),
        ("1995-2004", CSV_PATH_1995_2004, 1999)
    ]

    for era_label, fpath, default_yr in era_files:
        if not os.path.exists(fpath):
            print(f"Warning: {fpath} not found. Skipping.")
            continue

        print(f"Ingesting {era_label} tracks from {os.path.basename(fpath)}...")
        df_era = pd.read_csv(fpath)
        count_added = 0
        for _, r in df_era.iterrows():
            yt_url = str(r.get("youtube_url", ""))
            yt_id = extract_youtube_id(yt_url)
            if not yt_id or yt_id in seen_yt_ids:
                continue

            seen_yt_ids.add(yt_id)
            title = str(r.get("song_title", "Unknown Track")).strip()
            singers = str(r.get("song_singers", "Various Artists")).strip()
            rating = float(r.get("song_rating", 0.0)) if pd.notna(r.get("song_rating")) else 0.0

            # Inherit lyrics from cache if title/yt matches
            lyrics = lyrics_cache.get(title.lower(), lyrics_cache.get(yt_id, ""))
            thumb = f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg"

            all_records.append({
                "music_name": title,
                "singer": singers,
                "release": default_yr,
                "era": era_label,
                "lyrics": lyrics,
                "thumbnail": thumb,
                "youtube_id": yt_id,
                "song_rating": round(rating, 2),
            })
            count_added += 1

        print(f"  ✓ Added {count_added} unique tracks for era {era_label}.")

    df = pd.DataFrame(all_records)
    total_songs = len(df)
    print(f"\nTotal Consolidated Songs: {total_songs} across 30 years of Bollywood!")

    # 3. Clean and prepare text for NLP & TF-IDF
    print("\nProcessing text representations (NLP 12-step pipeline)...")
    clean_texts = []
    for _, r in df.iterrows():
        title = r["music_name"]
        singer = r["singer"]
        lyr = r["lyrics"]
        # If lyrics exist, use lyrics + title; else use title + singer
        if lyr and len(lyr) > 20:
            source_text = f"{title} {title} {lyr}"
        else:
            source_text = f"{title} {title} {title} {singer}"
        clean_texts.append(clean_lyrics(source_text))

    df["clean_lyrics"] = clean_texts

    # 4. Calculate Mood Scores & Primary Mood
    print("Calculating multi-dimensional mood scores & artist affinities...")
    primary_moods = []
    secondary_moods = []
    mood_score_cols = {f"{m['id'].lower()}_score": [] for m in SUPPORTED_MOODS}

    for idx, r in df.iterrows():
        clean_t = r["clean_lyrics"]
        singer = r["singer"]
        res = calculate_lyrics_mood_scores(clean_t, singer=singer)
        primary_moods.append(res["primary_mood"])
        secondary_moods.append(res["secondary_mood"])
        for m in SUPPORTED_MOODS:
            mood_id = m["id"]
            mood_score_cols[f"{mood_id.lower()}_score"].append(res["scores"].get(mood_id, 0.0))

    df["primary_mood"] = primary_moods
    df["secondary_mood"] = secondary_moods
    for col, scores in mood_score_cols.items():
        df[col] = scores

    # 5. Display Mood distribution
    print("\nMood distribution across 24,000+ songs:")
    mood_dist = df["primary_mood"].value_counts()
    for m in SUPPORTED_MOODS:
        mid = m["id"]
        count = mood_dist.get(mid, 0)
        pct = (count / total_songs) * 100
        print(f"  {m['emoji']} {mid:<13}: {count:>5} songs ({pct:5.1f}%)")

    # 6. Fit TF-IDF Vectorizer
    print("\nFitting TF-IDF Vectorizer (5,000 n-gram features)...")
    vectorizer = TfidfVectorizer(
        max_features=TFIDF_MAX_FEATURES,
        ngram_range=TFIDF_NGRAM_RANGE,
        min_df=TFIDF_MIN_DF,
        max_df=TFIDF_MAX_DF,
        sublinear_tf=TFIDF_SUBLINEAR_TF
    )

    tfidf_matrix = vectorizer.fit_transform(df["clean_lyrics"])
    print(f"✓ TF-IDF Matrix shape: {tfidf_matrix.shape}")

    # 7. Diagnostics & Evaluation
    print("\n" + "-" * 45)
    print("📊 Recommendation Engine Diagnostics:")
    print("-" * 45)
    for mood, query_str in MOOD_TFIDF_QUERIES.items():
        q_vec = vectorizer.transform([clean_lyrics(query_str)])
        sims = cosine_similarity(q_vec, tfidf_matrix).flatten()
        top10_sims = np.sort(sims)[-10:]
        print(f"  Avg top-10 similarity for [{mood:<12}]: {np.mean(top10_sims):.4f}")

    # 8. Save Models and Populate Database
    print("\nPersisting models and populating SQLite database...")
    os.makedirs(MODELS_DIR, exist_ok=True)

    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"✓ Saved vectorizer to {VECTORIZER_PATH}")

    joblib.dump(tfidf_matrix, SONG_MATRIX_PATH)
    print(f"✓ Saved song TF-IDF matrix to {SONG_MATRIX_PATH}")

    # Add numeric ID starting at 1
    df["id"] = range(1, len(df) + 1)
    joblib.dump(df, PROCESSED_DF_PATH)
    print(f"✓ Saved processed dataframe to {PROCESSED_DF_PATH}")

    init_db()
    records = df.to_dict(orient="records")
    save_songs(records)
    print(f"✓ Successfully populated SQLite database ({len(records)} songs).")

    print("\n🎉 Model training & dataset expansion complete!")
    print("=" * 65)


if __name__ == "__main__":
    train()
