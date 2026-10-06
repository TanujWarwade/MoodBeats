import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
ORIGINAL_DB_PATH = os.path.join(DATA_DIR, "music_mood.db")

# In serverless / Vercel environments, ensure SQLite DB is in writable /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    import shutil
    TMP_DIR = "/tmp/music_mood_data"
    os.makedirs(TMP_DIR, exist_ok=True)
    DATABASE_PATH = os.path.join(TMP_DIR, "music_mood.db")
    if not os.path.exists(DATABASE_PATH):
        db_sources = [
            ORIGINAL_DB_PATH,
            os.path.join(BASE_DIR, "data", "music_mood.db"),
            os.path.join(BASE_DIR, "music_mood.db"),
            os.path.join(os.getcwd(), "backend", "data", "music_mood.db"),
            os.path.join(os.path.dirname(BASE_DIR), "backend", "data", "music_mood.db"),
        ]
        copied = False
        for src in db_sources:
            if os.path.exists(src) and os.path.getsize(src) > 0:
                try:
                    shutil.copy2(src, DATABASE_PATH)
                    print(f"Successfully copied DB from {src} to {DATABASE_PATH}")
                    copied = True
                    break
                except Exception as e:
                    print(f"Notice: Failed copying from {src}: {e}")
        if not copied and not os.path.exists(DATABASE_PATH):
            try:
                import sqlite3
                conn = sqlite3.connect(DATABASE_PATH)
                conn.close()
                print(f"Created empty DB at {DATABASE_PATH}")
            except Exception as e:
                print(f"Failed to touch empty DB: {e}")
else:
    DATABASE_PATH = ORIGINAL_DB_PATH

# Datasets
CSV_PATH_LEGACY = os.path.join(DATA_DIR, "Bollywood-Songs-Dataset(2017-23).csv")
CSV_PATH_1995_2004 = os.path.join(DATA_DIR, "songs_1995_2004.csv")
CSV_PATH_2005_2014 = os.path.join(DATA_DIR, "songs_2005_2014.csv")
CSV_PATH_2015_2025 = os.path.join(DATA_DIR, "songs_2015_2025.csv")

VECTORIZER_PATH = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
SONG_MATRIX_PATH = os.path.join(MODELS_DIR, "song_matrix.pkl")
PROCESSED_DF_PATH = os.path.join(MODELS_DIR, "processed_songs.pkl")

# Supported Primary Moods
SUPPORTED_MOODS = [
    {
        "id": "Happy",
        "name": "Happy",
        "emoji": "😄",
        "description": "Joyful, upbeat, and celebratory songs to brighten your day.",
        "color": "#F59E0B"
    },
    {
        "id": "Sad",
        "name": "Sad",
        "emoji": "😢",
        "description": "Heartfelt, emotional, and melancholy melodies for tender moments.",
        "color": "#3B82F6"
    },
    {
        "id": "Romantic",
        "name": "Romantic",
        "emoji": "❤️",
        "description": "Passionate love ballads and soul-stirring romantic tracks.",
        "color": "#EC4899"
    },
    {
        "id": "Calm",
        "name": "Calm",
        "emoji": "😌",
        "description": "Peaceful, soothing, and relaxing acoustics to slow things down.",
        "color": "#10B981"
    },
    {
        "id": "Energetic",
        "name": "Energetic",
        "emoji": "⚡",
        "description": "High-octane dance numbers, beats, and party anthems.",
        "color": "#8B5CF6"
    },
    {
        "id": "Motivational",
        "name": "Motivational",
        "emoji": "🔥",
        "description": "Inspiring, powerful songs of perseverance, ambition, and victory.",
        "color": "#EF4444"
    },
    {
        "id": "Nostalgic",
        "name": "Nostalgic",
        "emoji": "🥹",
        "description": "Evocative melodies that bring back memories, childhood, and bygone days.",
        "color": "#6366F1"
    }
]

# Comprehensive Bollywood Mood Lexicon (English + Hindi / Hinglish + Title Hooks)
MOOD_LEXICON = {
    "Happy": [
        "happy", "smile", "smiling", "khushi", "khush", "khushiyan", "hasi", "muskurana",
        "muskura", "joyful", "joy", "celebrate", "celebration", "party", "dance", "fun",
        "masti", "mast", "hasna", "deewana", "pagal", "rang", "rangraliyan", "jashn",
        "taare", "dhamaka", "raunak", "laughter", "laugh", "cheerful", "delight", "sunshine",
        "bliss", "enjoy", "festive", "bindaas", "chill", "mubarak", "gulaal", "dholida",
        "ghungroo", "bhangra", "shava", "balle", "nacho", "gal mithi"
    ],
    "Sad": [
        "sad", "alone", "lonely", "rona", "roye", "aansu", "dard", "pain", "udaas", "judai",
        "juda", "broken", "hurt", "tanha", "tanhai", "aansoo", "gham", "bikhra", "tutna",
        "tuta", "khona", "kho", "alvida", "ashk", "sitam", "bewafa", "chhod", "chhodna",
        "tear", "tears", "grief", "cry", "crying", "weep", "hopeless", "melancholy", "heartbreak",
        "heartbroken", "gloomy", "darkness", "bezubaan", "jiyun", "kaisey", "bhoola", "bhula",
        "lauta", "ruswa", "akela", "akele", "faasle", "dooriyan", "dhokha", "ghutan", "saza"
    ],
    "Romantic": [
        "love", "ishq", "mohabbat", "pyaar", "pyar", "jaan", "dil", "romance", "kiss",
        "lover", "sanam", "mehboob", "aashiq", "aashiqui", "dhadkan", "nazar", "chahat",
        "deewangi", "saans", "humsafar", "baahon", "tere", "meri", "humdum", "rabba",
        "ishqbaazi", "afreen", "darmiyan", "sweetheart", "beloved", "embrace", "passion",
        "saathiya", "ishqholic", "baatein", "naina", "akhiyan", "ankhiyon", "kesariya",
        "raataan", "lambiyan", "soch", "shayari", "chaha", "deedar", "tera", "tujhe", "tujhko"
    ],
    "Calm": [
        "peace", "peaceful", "sukoon", "shanti", "calm", "relax", "silence", "khamoshi",
        "chain", "aaram", "raahat", "hawa", "hawayein", "dhimi", "thehra", "thehrav",
        "shaam", "subah", "chaand", "chand", "serene", "tranquil", "gentle", "soft",
        "soothing", "whisper", "meditation", "breeze", "still", "zen", "chhoo", "chhoo lo",
        "baarishein", "nadi", "pani", "safar", "lehar", "rooh", "khwabon", "sitare", "khoya"
    ],
    "Energetic": [
        "dance", "party", "energy", "fire", "high", "crazy", "beat", "nach", "nachan",
        "nachna", "energetic", "power", "josh", "junoon", "shor", "loud", "groove",
        "thumka", "dhol", "bhangra", "club", "disco", "hungama", "tezz", "jalwa", "blast",
        "pump", "wild", "electric", "bass", "rhythm", "swag", "dj", "kala chashma", "kudi",
        "munda", "tadka", "dhamaka", "badtameez", "kamariya", "chokra", "malhari"
    ],
    "Motivational": [
        "success", "jeet", "struggle", "mehnat", "dream", "sapna", "hustle", "fight",
        "never", "rise", "power", "believe", "goal", "achievement", "himmat", "hausla",
        "bulandi", "chhoo", "manzil", "ziddi", "fateh", "kamyabi", "jazba", "iraada",
        "victory", "win", "champion", "conquer", "inspire", "inspiration", "strength",
        "courage", "overcome", "triumph", "warrior", "unstoppable", "brave", "vande",
        "mataram", "bandey", "chunar", "zindagi", "dangal", "sultan", "chak de", "kar har"
    ],
    "Nostalgic": [
        "yaadein", "yaad", "memories", "bachpan", "old", "past", "nostalgia", "remember",
        "pal", "guzra", "guzre", "woh", "din", "woh din", "lamhe", "beete", "purane",
        "purana", "purani", "waqt", "zamaana", "zamana", "dost", "dosti", "school",
        "college", "galiyan", "aaoge", "reminisce", "flashback", "childhood", "golden",
        "yesterday", "recollect", "yearning", "sentimental", "chalte chalte", "kabhi alvida"
    ]
}

# Representative queries for TF-IDF cosine matching
MOOD_TFIDF_QUERIES = {
    "Happy": "happy smile khushi khush khushiyan hasi muskurana joyful celebrate celebration party dance fun masti pyar rang jashn",
    "Sad": "sad alone lonely rona roye aansu dard pain udaas judai broken hurt tanha tanhai gham bikhra tuta alvida bezubaan",
    "Romantic": "love ishq mohabbat pyaar pyar jaan dil romance kiss lover sanam mehboob aashiq aashiqui dhadkan nazar saathiya chahat",
    "Calm": "peace peaceful sukoon shanti calm relax silence khamoshi chain aaram raahat thehrav hawa chhoo lo shaam serene gentle soothing",
    "Energetic": "dance party energy fire high crazy beat nach nachna energetic power josh junoon thumka groove dhol club blast swag",
    "Motivational": "success jeet struggle mehnat dream sapna hustle fight rise power believe goal achievement himmat hausla manzil vande mataram",
    "Nostalgic": "yaadein yaad memories bachpan old past nostalgia remember pal guzra guzre woh din lamhe beete purane zamana waqt"
}

# Singer Mood Priors (Heuristic affinities)
SINGER_MOOD_PRIORS = {
    "arijit singh": {"Romantic": 0.40, "Sad": 0.35, "Calm": 0.15},
    "atif aslam": {"Romantic": 0.45, "Sad": 0.35, "Calm": 0.15},
    "kk": {"Romantic": 0.35, "Sad": 0.35, "Nostalgic": 0.20},
    "the local train": {"Calm": 0.45, "Nostalgic": 0.30, "Motivational": 0.15},
    "badshah": {"Energetic": 0.60, "Happy": 0.30},
    "yo yo honey singh": {"Energetic": 0.65, "Happy": 0.25},
    "mika singh": {"Energetic": 0.55, "Happy": 0.35},
    "diljit dosanjh": {"Energetic": 0.45, "Happy": 0.35, "Romantic": 0.15},
    "sonu nigam": {"Romantic": 0.35, "Nostalgic": 0.30, "Sad": 0.20},
    "udit narayan": {"Nostalgic": 0.45, "Romantic": 0.35, "Happy": 0.15},
    "kumar sanu": {"Nostalgic": 0.50, "Romantic": 0.40},
    "alka yagnik": {"Nostalgic": 0.45, "Romantic": 0.35},
    "shreya ghoshal": {"Romantic": 0.45, "Calm": 0.25, "Sad": 0.15},
    "mohit chauhan": {"Calm": 0.40, "Romantic": 0.30, "Nostalgic": 0.20},
    "jubin nautiyal": {"Romantic": 0.45, "Sad": 0.35},
    "b praak": {"Sad": 0.65, "Romantic": 0.25},
    "prateek kuhad": {"Calm": 0.55, "Romantic": 0.30},
    "lucky ali": {"Calm": 0.50, "Nostalgic": 0.35},
}

# TF-IDF Vectorizer configuration
TFIDF_MAX_FEATURES = 5000
TFIDF_NGRAM_RANGE = (1, 2)
TFIDF_MIN_DF = 2
TFIDF_MAX_DF = 0.95
TFIDF_SUBLINEAR_TF = True

# Recommendation weights
COSINE_WEIGHT = 0.55
MOOD_WEIGHT = 0.30
RATING_WEIGHT = 0.15

# Personalization weights
BASE_SCORE_WEIGHT = 1.0
PREF_MOOD_WEIGHT = 0.25
PREF_ARTIST_WEIGHT = 0.20
PREF_YEAR_WEIGHT = 0.10
LIKE_BONUS = 0.15
SAVE_BONUS = 0.20
DISLIKE_PENALTY = 0.50
