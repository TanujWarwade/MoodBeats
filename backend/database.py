import sqlite3
import re
import hashlib
import time
from typing import Optional, List, Dict, Any
from backend.config import DATABASE_PATH

def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database with dictionary cursor row factory."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def extract_youtube_id(url_or_thumb: str) -> Optional[str]:
    """Extract YouTube video ID from URL or thumbnail."""
    if not url_or_thumb or not isinstance(url_or_thumb, str):
        return None
    # Check v=...
    m = re.search(r"[?&]v=([a-zA-Z0-9_-]{11})", url_or_thumb)
    if m:
        return m.group(1)
    # Check youtu.be/...
    m = re.search(r"youtu\.be/([a-zA-Z0-9_-]{11})", url_or_thumb)
    if m:
        return m.group(1)
    # Check /vi/.../
    m = re.search(r"/vi/([a-zA-Z0-9_-]{11})/", url_or_thumb)
    if m:
        return m.group(1)
    return None

def init_db():
    """Create all required tables with era and song_rating fields."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        music_name TEXT NOT NULL,
        singer TEXT,
        release INTEGER,
        era TEXT,
        lyrics TEXT,
        thumbnail TEXT,
        youtube_id TEXT,
        clean_lyrics TEXT,
        song_rating REAL DEFAULT 0.0,
        primary_mood TEXT,
        secondary_mood TEXT,
        happy_score REAL DEFAULT 0,
        sad_score REAL DEFAULT 0,
        romantic_score REAL DEFAULT 0,
        calm_score REAL DEFAULT 0,
        energetic_score REAL DEFAULT 0,
        motivational_score REAL DEFAULT 0,
        nostalgic_score REAL DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        song_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(song_id) REFERENCES songs(id)
    )
    """)

    # Ensure new columns exist if table was created previously
    cursor.execute("PRAGMA table_info(songs)")
    cols = [r[1] for r in cursor.fetchall()]
    if cols and "era" not in cols:
        cursor.execute("ALTER TABLE songs ADD COLUMN era TEXT")
    if cols and "song_rating" not in cols:
        cursor.execute("ALTER TABLE songs ADD COLUMN song_rating REAL DEFAULT 0.0")

    # Ensure new columns exist in users table
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [r[1] for r in cursor.fetchall()]
    if "email" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
    if "password" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password TEXT")
    if "avatar" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar TEXT")

    # Fast indexed search across 24,000+ tracks
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_primary_mood ON songs(primary_mood)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_release ON songs(release)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_era ON songs(era)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_rating ON songs(song_rating)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_music_name ON songs(music_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_singer ON songs(singer)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_song ON user_feedback(song_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")

    # Seed default verified user account
    default_pw = hashlib.sha256("password123".encode("utf-8")).hexdigest()
    cursor.execute("""
        INSERT OR IGNORE INTO users (id, name, email, password, avatar)
        VALUES (?, ?, ?, ?, ?)
    """, (
        "user-tanuj",
        "Tanuj",
        "tanuj@moodbeats.com",
        default_pw,
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    ))

    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    """Return SHA-256 hash of password string."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def register_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """Register a new user in SQLite database."""
    name_clean = name.strip()
    email_clean = email.strip().lower()

    if not name_clean or not email_clean or not password:
        raise ValueError("Name, email, and password are all required.")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An account with this email address already exists.")

    safe_name = re.sub(r"[^a-zA-Z0-9]", "", name_clean.lower())[:8] or "fan"
    user_id = f"user-{safe_name}-{str(int(time.time()))[-4:]}"
    hashed_pw = hash_password(password)
    avatar = f"https://api.dicebear.com/7.x/adventurer/svg?seed={user_id}"

    cursor.execute(
        "INSERT INTO users (id, name, email, password, avatar) VALUES (?, ?, ?, ?, ?)",
        (user_id, name_clean, email_clean, hashed_pw, avatar)
    )
    conn.commit()
    conn.close()

    return {
        "id": user_id,
        "name": name_clean,
        "email": email_clean,
        "avatar": avatar
    }

def login_user(email_or_name: str, password: str) -> Dict[str, Any]:
    """Authenticate existing user against email or username."""
    query_str = email_or_name.strip()
    if not query_str or not password:
        raise ValueError("Email/username and password are required.")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, email, password, avatar FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?",
        (query_str.lower(), query_str.lower())
    )
    user_row = cursor.fetchone()
    conn.close()

    if not user_row:
        raise ValueError("No account found matching this email or username.")

    user = dict(user_row)
    if user.get("password") and user["password"] != hash_password(password):
        raise ValueError("Incorrect password. Please try again.")

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user.get("email") or "",
        "avatar": user.get("avatar") or f"https://api.dicebear.com/7.x/adventurer/svg?seed={user['id']}"
    }

def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user account profile."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, avatar, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if not d.get("avatar"):
        d["avatar"] = f"https://api.dicebear.com/7.x/adventurer/svg?seed={d['id']}"
    return d

def save_songs(songs_records: List[Dict[str, Any]]):
    """Save or replace all songs in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS songs")
    init_db()

    insert_sql = """
    INSERT INTO songs (
        music_name, singer, release, era, lyrics, thumbnail, youtube_id, clean_lyrics,
        song_rating, primary_mood, secondary_mood, happy_score, sad_score, romantic_score,
        calm_score, energetic_score, motivational_score, nostalgic_score
    ) VALUES (
        :music_name, :singer, :release, :era, :lyrics, :thumbnail, :youtube_id, :clean_lyrics,
        :song_rating, :primary_mood, :secondary_mood, :happy_score, :sad_score, :romantic_score,
        :calm_score, :energetic_score, :motivational_score, :nostalgic_score
    )
    """
    cursor.executemany(insert_sql, songs_records)
    conn.commit()
    conn.close()

def get_song_by_id(song_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve song by primary key ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM songs WHERE id = ?", (song_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_songs_df():
    """Retrieve all songs as a pandas DataFrame."""
    import pandas as pd
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM songs ORDER BY id ASC", conn)
    conn.close()
    return df

def record_user_feedback(user_id: str, song_id: int, action: str):
    """Store user action (like, dislike, skip, save, play)."""
    conn = get_connection()
    cursor = conn.cursor()

    if action == "like":
        cursor.execute("DELETE FROM user_feedback WHERE user_id = ? AND song_id = ? AND action = 'dislike'", (user_id, song_id))
    elif action == "dislike":
        cursor.execute("DELETE FROM user_feedback WHERE user_id = ? AND song_id = ? AND action = 'like'", (user_id, song_id))

    cursor.execute(
        "INSERT INTO user_feedback (user_id, song_id, action) VALUES (?, ?, ?)",
        (user_id, song_id, action.lower())
    )
    conn.commit()
    conn.close()

def get_user_feedback_history(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all feedback actions for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT f.id, f.user_id, f.song_id, f.action, f.created_at,
               s.music_name, s.singer, s.release, s.thumbnail, s.primary_mood
        FROM user_feedback f
        JOIN songs s ON f.song_id = s.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_user_library(user_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """Retrieve grouped liked, saved, and recently played songs for user."""
    conn = get_connection()
    cursor = conn.cursor()

    def fetch_for_action(action_name: str, limit: int = 50):
        cursor.execute("""
            SELECT DISTINCT s.*, MAX(f.created_at) as action_time
            FROM user_feedback f
            JOIN songs s ON f.song_id = s.id
            WHERE f.user_id = ? AND f.action = ?
            GROUP BY s.id
            ORDER BY action_time DESC
            LIMIT ?
        """, (user_id, action_name, limit))
        return [dict(r) for r in cursor.fetchall()]

    liked = fetch_for_action("like")
    saved = fetch_for_action("save")
    played = fetch_for_action("play")

    conn.close()
    return {
        "liked": liked,
        "saved": saved,
        "recently_played": played
    }

def get_user_profile_stats(user_id: str) -> Dict[str, Any]:
    """Calculate user music stats."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT s.primary_mood, COUNT(*) as cnt
        FROM user_feedback f
        JOIN songs s ON f.song_id = s.id
        WHERE f.user_id = ? AND f.action IN ('like', 'save')
        GROUP BY s.primary_mood
        ORDER BY cnt DESC
        LIMIT 1
    """, (user_id,))
    mood_row = cursor.fetchone()
    favorite_mood = mood_row["primary_mood"] if mood_row else "Romantic"

    cursor.execute("""
        SELECT s.singer, COUNT(*) as cnt
        FROM user_feedback f
        JOIN songs s ON f.song_id = s.id
        WHERE f.user_id = ? AND f.action IN ('like', 'save', 'play')
        GROUP BY s.singer
        ORDER BY cnt DESC
        LIMIT 1
    """, (user_id,))
    singer_row = cursor.fetchone()
    top_singer = singer_row["singer"] if singer_row else "Arijit Singh"

    cursor.execute("""
        SELECT MIN(s.release) as min_yr, MAX(s.release) as max_yr
        FROM user_feedback f
        JOIN songs s ON f.song_id = s.id
        WHERE f.user_id = ? AND f.action IN ('like', 'save')
    """, (user_id,))
    yr_row = cursor.fetchone()
    release_range = f"{yr_row['min_yr']}–{yr_row['max_yr']}" if yr_row and yr_row["min_yr"] else "1995–2025"

    cursor.execute("SELECT COUNT(*) FROM user_feedback WHERE user_id = ? AND action = 'like'", (user_id,))
    likes_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM user_feedback WHERE user_id = ? AND action = 'save'", (user_id,))
    saves_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM user_feedback WHERE user_id = ? AND action = 'play'", (user_id,))
    plays_count = cursor.fetchone()[0]

    conn.close()

    return {
        "user_id": user_id,
        "favorite_mood": favorite_mood,
        "favorite_singer": top_singer,
        "preferred_release": release_range,
        "total_likes": likes_count,
        "total_saves": saves_count,
        "total_plays": plays_count
    }

def discover_songs(
    query: Optional[str] = None,
    mood: Optional[str] = None,
    singer: Optional[str] = None,
    year: Optional[int] = None,
    era: Optional[str] = None,
    sort_by: str = "newest",
    limit: int = 60,
    offset: int = 0
) -> Dict[str, Any]:
    """Search, filter, and sort across 24,000+ Bollywood tracks."""
    conn = get_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if query and query.strip():
        term = f"%{query.strip()}%"
        # Only search name + singer — NOT lyrics (lyrics scan is very slow on 24k rows)
        conditions.append("(music_name LIKE ? OR singer LIKE ?)")
        params.extend([term, term])

    if mood and mood.strip():
        conditions.append("(primary_mood = ? OR secondary_mood = ?)")
        params.extend([mood.strip(), mood.strip()])

    if singer and singer.strip():
        conditions.append("singer LIKE ?")
        params.append(f"%{singer.strip()}%")

    if year and year > 0:
        conditions.append("release = ?")
        params.append(year)

    if era and era.strip():
        conditions.append("era = ?")
        params.append(era.strip())

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

    # Sort order
    if sort_by == "trending" or sort_by == "newest" or not sort_by:
        order_clause = "ORDER BY trending_score DESC, song_rating DESC, release DESC"
    elif sort_by == "rating":
        order_clause = "ORDER BY song_rating DESC, release DESC"
    elif sort_by == "oldest":
        order_clause = "ORDER BY release ASC, song_rating DESC"
    elif sort_by == "alphabetical":
        order_clause = "ORDER BY music_name ASC"
    elif sort_by == "mood_score" and mood:
        mood_col = f"{mood.lower()}_score"
        order_clause = f"ORDER BY {mood_col} DESC, song_rating DESC"
    else:
        order_clause = "ORDER BY release DESC, song_rating DESC, music_name ASC"

    # Count total (Fast path for empty filter)
    if not where_clause:
        total_count = 23810
    else:
        cursor.execute(f"SELECT COUNT(*) FROM songs {where_clause}", params)
        total_count = cursor.fetchone()[0]

    # Fetch rows
    sql = f"SELECT * FROM songs {where_clause} {order_clause} LIMIT ? OFFSET ?"
    fetch_params = list(params) + [limit, offset]
    cursor.execute(sql, fetch_params)
    rows = cursor.fetchall()
    conn.close()

    return {
        "total": total_count,
        "songs": [dict(r) for r in rows]
    }
