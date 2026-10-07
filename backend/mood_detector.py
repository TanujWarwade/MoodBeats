import math
import re
try:
    from backend.config import MOOD_LEXICON, SUPPORTED_MOODS, SINGER_MOOD_PRIORS
    from backend.preprocessing import clean_lyrics, get_meaningful_tokens
except ModuleNotFoundError:
    from config import MOOD_LEXICON, SUPPORTED_MOODS, SINGER_MOOD_PRIORS
    from preprocessing import clean_lyrics, get_meaningful_tokens

MOOD_NAMES = [m["id"] for m in SUPPORTED_MOODS]

# Common natural language intent triggers in Hindi / Hinglish and English
INTENT_PHRASES = {
    "Sad": [
        "breakup", "broken heart", "crying", "feeling down", "depressed", "heartbroken",
        "hurt", "lonely", "miss someone", "tears in eyes", "lost someone", "dil toot gaya",
        "rona aa raha", "bahut udaas", "dard ho raha", "tanha hoon", "tanhai", "aansu",
        "gham", "judai", "udaas", "sad songs", "chhod gaya", "chhod gayi"
    ],
    "Romantic": [
        "romantic", "in love", "candlelight", "date night", "crush", "with partner",
        "with girlfriend", "with boyfriend", "pyaar", "ishq", "mohabbat", "dil ki baat",
        "falling in love", "humsafar", "beloved", "love song", "sweetheart", "saathiya",
        "romantic vibes", "for my love"
    ],
    "Happy": [
        "feeling happy", "good mood", "cheerful", "celebrating", "smile", "joyful",
        "khush hoon", "bohot khush", "masti", "fun mood", "positive vibes", "great day",
        "feeling great", "laughing", "party vibe", "jashn"
    ],
    "Calm": [
        "peaceful", "peace of mind", "calm down", "relax", "relaxation", "meditation",
        "sleep", "sleeping", "slow down", "quiet", "sukoon chahiye", "shanti",
        "thoda peaceful", "unwind", "stress relief", "tired and want calm", "sukoon",
        "chhoo lo", "soothing"
    ],
    "Energetic": [
        "gym", "workout", "workout music", "party", "dance", "dancing", "high energy",
        "pump up", "club", "dj", "nachna hai", "josh", "tezz gaane", "running",
        "cardio", "bass boost", "fire", "dance party", "bhangra", "nach"
    ],
    "Motivational": [
        "study", "focus", "work hard", "motivation", "motivational", "inspire",
        "exam", "achieve", "never give up", "hustle", "mehnat", "jeet", "himmat",
        "success", "win", "struggle", "dreams", "vande mataram", "hausla", "kar har"
    ],
    "Nostalgic": [
        "old days", "childhood", "memories", "past", "reminisce", "purane din",
        "woh din", "yaad aa rahi", "yaadein", "school days", "college memories",
        "missing the past", "nostalgia", "flashback", "90s songs", "old bollywood",
        "purane gaane", "golden era"
    ]
}


def calculate_lyrics_mood_scores(clean_text: str, singer: str = "") -> dict:
    """
    Calculate normalized mood scores from text (lyrics or title) and singer priors.
    Length-normalized to avoid bias towards long text.
    Assign primary_mood and secondary_mood.
    """
    tokens = clean_text.split() if clean_text else []
    total_tokens = len(tokens)

    raw_scores = {m: 0.0 for m in MOOD_NAMES}
    word_matches = {m: [] for m in MOOD_NAMES}

    clean_lower = clean_text.lower() if clean_text else ""

    # 1. Word and phrase match in lexicon
    for mood, keywords in MOOD_LEXICON.items():
        keyword_set = set(keywords)
        matched = [t for t in tokens if t in keyword_set]
        
        # Also check substring / multi-word matches (e.g. "chhoo lo", "woh din", "vande mataram")
        for kw in keywords:
            if " " in kw and kw in clean_lower:
                matched.append(kw)

        word_matches[mood] = list(set(matched))
        count = len(matched)
        
        if count > 0:
            raw_scores[mood] += (count / max(total_tokens, 6)) * (1.0 + math.log1p(count * 2))

    # 2. Artist affinity prior if available
    singer_lower = singer.lower().strip() if singer else ""
    for known_singer, priors in SINGER_MOOD_PRIORS.items():
        if known_singer in singer_lower:
            for m, prior_val in priors.items():
                if m in raw_scores:
                    raw_scores[m] += prior_val * 0.35
            break

    # Base smoothing
    smoothing = 0.02
    total_score = sum(raw_scores.values()) + (smoothing * len(MOOD_NAMES))

    normalized_scores = {}
    for mood in MOOD_NAMES:
        normalized_scores[mood] = round((raw_scores.get(mood, 0.0) + smoothing) / total_score, 4)

    # Sort moods by score descending
    sorted_moods = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
    primary_mood, top_score = sorted_moods[0]
    second_mood, second_score = sorted_moods[1]

    # Secondary mood threshold
    if second_score >= (0.65 * top_score) and second_score >= 0.14:
        secondary_mood = second_mood
    else:
        secondary_mood = None

    return {
        "primary_mood": primary_mood,
        "secondary_mood": secondary_mood,
        "scores": normalized_scores,
        "matched_words": word_matches
    }


def detect_mood_from_text(text: str) -> dict:
    """
    Infers user mood from natural language query (English, Hindi, Hinglish).
    Returns detected_mood, confidence, low_confidence flag, explanation.
    """
    if not text or not text.strip():
        return {
            "detected_mood": "Happy",
            "confidence": 0.50,
            "low_confidence": True,
            "message": "No mood text provided. Defaulting to Happy.",
            "scores": {m: round(1.0 / len(MOOD_NAMES), 4) for m in MOOD_NAMES}
        }

    raw_lower = text.lower().strip()
    cleaned = clean_lyrics(raw_lower)
    tokens = cleaned.split()

    scores = {m: 0.0 for m in MOOD_NAMES}
    reasons = {m: [] for m in MOOD_NAMES}

    # 1. Multi-word intent phrase matching (heavy weight: +3.5 per phrase)
    for mood, phrases in INTENT_PHRASES.items():
        for phrase in phrases:
            if phrase in raw_lower:
                scores[mood] += 3.5
                reasons[mood].append(f"phrase '{phrase}'")

    # 2. Individual lexicon word matching in tokens (+1.2 per word)
    for mood, keywords in MOOD_LEXICON.items():
        keyword_set = set(keywords)
        for t in tokens:
            if t in keyword_set:
                scores[mood] += 1.2
                if t not in reasons[mood]:
                    reasons[mood].append(t)

    # 3. Direct mood name mention (+4.0)
    for mood in MOOD_NAMES:
        m_lower = mood.lower()
        if re.search(rf"\b{m_lower}\b", raw_lower):
            scores[mood] += 4.0
            reasons[mood].append(f"direct mention of '{mood}'")

    total_pts = sum(scores.values())

    if total_pts == 0:
        return {
            "detected_mood": "Calm",
            "confidence": 0.40,
            "low_confidence": True,
            "message": "We couldn't clearly detect a mood from your text. Showing Calm songs.",
            "scores": {m: round(1.0 / len(MOOD_NAMES), 4) for m in MOOD_NAMES}
        }

    norm_scores = {}
    for mood, val in scores.items():
        norm_scores[mood] = round((val + 0.1) / (total_pts + 0.1 * len(MOOD_NAMES)), 4)

    sorted_moods = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_mood, best_val = sorted_moods[0]
    runner_up_mood, runner_up_val = sorted_moods[1]

    raw_confidence = 0.50 + (0.45 * (best_val / (best_val + runner_up_val + 0.001)))
    if best_val >= 3.0:
        raw_confidence = min(0.96, raw_confidence + 0.10)

    confidence = round(min(0.98, max(0.45, raw_confidence)), 2)
    low_confidence = confidence < 0.60

    matched_details = ", ".join(reasons[best_mood][:3])
    if matched_details:
        explanation = f"Detected {best_mood} mood from {matched_details}"
    else:
        explanation = f"Analyzed lyrics & sentiment indicating {best_mood} mood."

    return {
        "detected_mood": best_mood,
        "confidence": confidence,
        "low_confidence": low_confidence,
        "explanation": explanation,
        "scores": norm_scores
    }
