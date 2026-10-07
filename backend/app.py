import os
import sys

# Ensure UTF-8 stdout on Windows (ignored safely on Linux/Vercel)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ── Path & Package setup: ensure 'backend' package is always resolvable ──
# Works both when deployed as full project (from api/index.py) and when
# deployed with Root Directory set to backend/ (where __file__ is /var/task/app.py)
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_CURRENT_DIR)

for _p in [_CURRENT_DIR, _PARENT_DIR]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    try:
        import backend
    except ModuleNotFoundError:
        import types
        _backend_pkg = types.ModuleType("backend")
        _backend_pkg.__path__ = [_CURRENT_DIR]
        _backend_pkg.__file__ = os.path.join(_CURRENT_DIR, "__init__.py")
        sys.modules["backend"] = _backend_pkg

from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from backend.config import SUPPORTED_MOODS
    from backend.recommender import MusicRecommendationEngine
    from backend.database import (
        init_db,
        get_song_by_id,
        discover_songs,
        get_user_profile_stats,
        get_user_library,
        register_user,
        login_user,
        get_user_profile
    )
except ModuleNotFoundError:
    from config import SUPPORTED_MOODS
    from recommender import MusicRecommendationEngine
    from database import (
        init_db,
        get_song_by_id,
        discover_songs,
        get_user_profile_stats,
        get_user_library,
        register_user,
        login_user,
        get_user_profile
    )

app = Flask(__name__)
# Enable CORS for all routes so frontend on any port can access
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize engine & db
init_db()
engine = MusicRecommendationEngine()


@app.route("/", methods=["GET"])
def index():
    """Root endpoint for health and serverless verification."""
    return jsonify({
        "status": "ok",
        "app": "MoodBeats API",
        "version": "1.0.0",
        "message": "MoodBeats Backend API is running.",
        "endpoints": {
            "health": "/api/health",
            "moods": "/api/moods",
            "discover": "/api/discover",
        }
    })


@app.route("/favicon.ico", methods=["GET"])
def favicon():
    """Silence browser favicon requests."""
    return ("", 204)


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "app": "MoodBeats", "version": "1.0.0"})


@app.route("/api/auth/register", methods=["POST"])
@app.route("/auth/register", methods=["POST"])
def auth_register():
    """Register a new user account."""
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    try:
        user = register_user(name=name, email=email, password=password)
        return jsonify({
            "success": True,
            "message": f"Welcome to MoodBeats, {user['name']}!",
            "user": user
        })
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/auth/login", methods=["POST"])
@app.route("/auth/login", methods=["POST"])
def auth_login():
    """Authenticate an existing user."""
    data = request.get_json(force=True, silent=True) or {}
    email_or_name = data.get("email") or data.get("username") or ""
    password = data.get("password", "").strip()

    try:
        user = login_user(email_or_name=email_or_name, password=password)
        return jsonify({
            "success": True,
            "message": f"Welcome back, {user['name']}!",
            "user": user
        })
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/auth/profile", methods=["GET"])
@app.route("/auth/profile", methods=["GET"])
def auth_profile():
    """Get current profile by user_id."""
    user_id = request.args.get("user_id", "")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required"}), 400
    user = get_user_profile(user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({"success": True, "user": user})


@app.route("/api/moods", methods=["GET"])
@app.route("/moods", methods=["GET"])
def get_moods():
    """Return all supported primary moods with metadata."""
    return jsonify({
        "success": True,
        "moods": SUPPORTED_MOODS
    })


@app.route("/api/detect-mood", methods=["POST"])
@app.route("/detect-mood", methods=["POST"])
def detect_mood_api():
    """
    NLP Mood Detection:
    Input: { "text": "I am feeling sad today" }
    Output: { "mood": "Sad", "confidence": 0.82, "explanation": "...", "low_confidence": false }
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({
            "error": "Text parameter is required."
        }), 400

    result = engine.detect_mood(text)
    return jsonify({
        "mood": result["detected_mood"],
        "confidence": result["confidence"],
        "low_confidence": result["low_confidence"],
        "explanation": result["explanation"],
        "scores": result["scores"]
    })


@app.route("/api/recommend", methods=["POST"])
@app.route("/recommend", methods=["POST"])
def recommend_by_mood_api():
    """
    Recommend songs by selected mood:
    Input: { "mood": "Happy", "limit": 10, "user_id": "demo-user" }
    """
    data = request.get_json(force=True, silent=True) or {}
    mood = data.get("mood", "Happy")
    limit = int(data.get("limit", 10))
    user_id = data.get("user_id", "demo-user")

    recommendations = engine.recommend_by_mood(mood=mood, limit=limit, user_id=user_id)
    return jsonify({
        "success": True,
        "mood": mood,
        "count": len(recommendations),
        "recommendations": recommendations
    })


@app.route("/api/recommend/text", methods=["POST"])
@app.route("/recommend/text", methods=["POST"])
def recommend_by_text_api():
    """
    Recommend songs by natural language input:
    Input: { "text": "mujhe peaceful songs chahiye", "limit": 10, "user_id": "demo-user" }
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "").strip()
    limit = int(data.get("limit", 10))
    user_id = data.get("user_id", "demo-user")

    if not text:
        return jsonify({"error": "Text query is required."}), 400

    result = engine.recommend_by_text(text=text, limit=limit, user_id=user_id)
    return jsonify({
        "success": True,
        **result
    })


@app.route("/api/song/<int:song_id>", methods=["GET"])
@app.route("/song/<int:song_id>", methods=["GET"])
def get_song_details(song_id: int):
    """Return full song details, breakdown scores, and explanation."""
    song = get_song_by_id(song_id)
    if not song:
        return jsonify({"error": "Song not found."}), 404

    # Structure mood breakdown scores
    scores = {
        "happy": round(float(song.get("happy_score") or 0), 3),
        "sad": round(float(song.get("sad_score") or 0), 3),
        "romantic": round(float(song.get("romantic_score") or 0), 3),
        "calm": round(float(song.get("calm_score") or 0), 3),
        "energetic": round(float(song.get("energetic_score") or 0), 3),
        "motivational": round(float(song.get("motivational_score") or 0), 3),
        "nostalgic": round(float(song.get("nostalgic_score") or 0), 3),
    }

    primary_mood = song.get("primary_mood") or "Romantic"
    explanation = f"Recommended because its lyrics strongly match the {primary_mood} mood."

    return jsonify({
        "success": True,
        "song": {
            **song,
            "scores": scores,
            "why_this_song": explanation
        }
    })


@app.route("/api/song/<int:song_id>/similar", methods=["GET"])
@app.route("/song/<int:song_id>/similar", methods=["GET"])
def get_similar_songs(song_id: int):
    """Return similar songs using TF-IDF cosine similarity."""
    limit = int(request.args.get("limit", 10))
    similar = engine.recommend_similar_song(song_id=song_id, limit=limit)
    return jsonify({
        "success": True,
        "seed_song_id": song_id,
        "count": len(similar),
        "recommendations": similar
    })


@app.route("/api/feedback", methods=["POST"])
@app.route("/feedback", methods=["POST"])
def post_feedback():
    """
    Record user feedback action:
    Input: { "user_id": "demo-user", "song_id": 12, "action": "like" }
    """
    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("user_id", "demo-user")
    song_id = data.get("song_id")
    action = data.get("action")

    if not song_id or not action:
        return jsonify({"error": "song_id and action are required."}), 400

    try:
        engine.record_feedback(user_id=user_id, song_id=int(song_id), action=action)
        return jsonify({
            "success": True,
            "message": f"Action '{action}' recorded for song #{song_id}."
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/personalized", methods=["GET"])
@app.route("/personalized", methods=["GET"])
def get_personalized():
    """
    Returns personalized recommendations based on user feedback profile:
    GET /api/personalized?user_id=demo-user&mood=Romantic&limit=10
    """
    user_id = request.args.get("user_id", "demo-user")
    mood = request.args.get("mood")
    limit = int(request.args.get("limit", 10))

    recommendations = engine.get_personalized_recommendations(
        user_id=user_id,
        mood=mood,
        limit=limit
    )
    return jsonify({
        "success": True,
        "user_id": user_id,
        "count": len(recommendations),
        "recommendations": recommendations
    })


@app.route("/api/discover", methods=["GET"])
@app.route("/discover", methods=["GET"])
def discover_songs_api():
    """
    Search and filter songs for the Discover page:
    GET /api/discover?query=...&mood=...&singer=...&year=...&sort_by=...&limit=24&offset=0
    """
    query = request.args.get("query")
    mood = request.args.get("mood")
    singer = request.args.get("singer")
    year = request.args.get("year", type=int)
    era = request.args.get("era")
    sort_by = request.args.get("sort_by", "newest")
    limit = int(request.args.get("limit", 60))
    offset = int(request.args.get("offset", 0))

    result = discover_songs(
        query=query,
        mood=mood,
        singer=singer,
        year=year,
        era=era,
        sort_by=sort_by,
        limit=limit,
        offset=offset
    )
    return jsonify({
        "success": True,
        **result
    })


@app.route("/api/user/profile", methods=["GET"])
@app.route("/user/profile", methods=["GET"])
def user_profile():
    """Return user's dynamic music personality stats."""
    user_id = request.args.get("user_id", "demo-user")
    stats = get_user_profile_stats(user_id)
    return jsonify({
        "success": True,
        "profile": stats
    })


@app.route("/api/user/library", methods=["GET"])
@app.route("/user/library", methods=["GET"])
def user_library():
    """Return liked, saved, and recently played songs for user."""
    user_id = request.args.get("user_id", "demo-user")
    library = get_user_library(user_id)
    return jsonify({
        "success": True,
        **library
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🎵 Starting MoodBeats Flask API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
