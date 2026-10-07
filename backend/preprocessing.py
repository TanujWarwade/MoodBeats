import re
import unicodedata
try:
    from backend.config import MOOD_LEXICON
except ModuleNotFoundError:
    from config import MOOD_LEXICON

# Standard English stopwords (excluding emotional and mood-related words)
BASE_ENGLISH_STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
    "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
    "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s",
    "t", "can", "will", "just", "don", "should", "now", "d", "ll", "m", "o",
    "re", "ve", "y", "ain", "aren", "couldn", "didn", "doesn", "hadn",
    "hasn", "haven", "isn", "ma", "mightn", "mustn", "needn", "shan",
    "shouldn", "wasn", "weren", "won", "wouldn"
}

# Collect all lexicon words across moods to ensure emotional words are never dropped
ALL_LEXICON_WORDS = set()
for words in MOOD_LEXICON.values():
    ALL_LEXICON_WORDS.update(words)

# English stopwords that must NEVER be stripped because of emotional/mood context
PRESERVED_EMOTIONAL_WORDS = ALL_LEXICON_WORDS | {
    "cry", "crying", "alone", "love", "smile", "happy", "sad", "feel", "feeling",
    "never", "broken", "pain", "fire", "dream", "peace", "old", "lost", "tears",
    "shine", "dance", "beat", "rise", "power", "win", "high", "wild"
}

EFFECTIVE_STOPWORDS = BASE_ENGLISH_STOPWORDS - PRESERVED_EMOTIONAL_WORDS

# Lemmatization mappings for common English inflections in music/lyrics
COMMON_LEMMAS = {
    "smiling": "smile",
    "smiles": "smile",
    "smiled": "smile",
    "dancing": "dance",
    "dances": "dance",
    "danced": "dance",
    "loving": "love",
    "loves": "love",
    "loved": "love",
    "lover": "lover",
    "lovers": "lover",
    "crying": "cry",
    "cries": "cry",
    "cried": "cry",
    "feeling": "feel",
    "feelings": "feel",
    "felt": "feel",
    "celebrating": "celebrate",
    "celebrates": "celebrate",
    "celebrated": "celebrate",
    "celebrations": "celebration",
    "memories": "memory",
    "tears": "tear",
    "broken": "broken",
    "breaking": "break",
    "breaks": "break",
    "hoping": "hope",
    "hopes": "hope",
    "hoped": "hope",
    "struggling": "struggle",
    "struggles": "struggle",
    "struggled": "struggle",
    "dreams": "dream",
    "dreaming": "dream",
    "dreamed": "dream",
    "fights": "fight",
    "fighting": "fight",
    "battles": "battle",
    "battling": "battle",
    "remembering": "remember",
    "remembers": "remember",
    "remembered": "remember",
    "breathing": "breathe",
    "breathes": "breathe",
    "breathed": "breathe",
    "shining": "shine",
    "shines": "shine",
    "burning": "burn",
    "burns": "burn",
    "burned": "burn",
    "rising": "rise",
    "rises": "rise",
    "singing": "sing",
    "sings": "sing",
    "sang": "sing",
    "sung": "sing",
    "falling": "fall",
    "falls": "fall",
    "fell": "fall",
    "fallen": "fall",
    "living": "live",
    "lives": "live",
    "lived": "live",
    "beating": "beat",
    "beats": "beat",
    "hurting": "hurt",
    "hurts": "hurt",
    "winning": "win",
    "wins": "win",
    "won": "win"
}


def lemmatize_word(word: str) -> str:
    """Lemmatize an English word while preserving Hinglish and lexicon terms."""
    if word in COMMON_LEMMAS:
        return COMMON_LEMMAS[word]
    
    # Don't alter short words or known lexicon words
    if len(word) <= 3 or word in ALL_LEXICON_WORDS:
        return word

    # Regular rule-based lemmatization for other English words
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("ing") and len(word) > 5:
        # e.g., dreaming -> dream, but check doubling: running -> run
        base = word[:-3]
        if len(base) > 2 and base[-1] == base[-2] and base[-1] not in "lsz":
            return base[:-1]
        return base
    if word.endswith("ed") and len(word) > 4:
        base = word[:-2]
        if base.endswith("e"):
            return base
        return word[:-1] if word.endswith("eed") else base
    if word.endswith("es") and len(word) > 4 and word[-3] in "sxyzchsh":
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]

    return word


def clean_lyrics(text: str) -> str:
    """
    NLP Preprocessing Pipeline for lyrics:
    1. Convert text to lowercase.
    2. Remove URLs.
    3. Remove HTML tags.
    4. Remove punctuation.
    5. Remove unnecessary special characters.
    6. Remove extra whitespace.
    7. Tokenize text.
    8. Remove English stopwords where appropriate.
    9. Apply lemmatization.
    10. Handle empty/null lyrics.
    11. Preserve meaningful emotional words.
    12. Preserve Hindi/Hinglish words.
    """
    if text is None or not isinstance(text, str):
        return ""

    # 1. Lowercase
    cleaned = text.lower()

    # Normalize unicode characters
    cleaned = unicodedata.normalize("NFKD", cleaned)

    # 2. Remove URLs
    cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned)

    # 3. Remove HTML tags
    cleaned = re.sub(r"<.*?>", " ", cleaned)

    # 4 & 5. Remove punctuation and special characters, keep alphanumeric and Hindi unicode
    # Preserves romanized Hindi characters and spaces
    cleaned = re.sub(r"[^\w\s\u0900-\u097F]", " ", cleaned)
    cleaned = re.sub(r"[\d_]+", " ", cleaned)

    # 6. Remove extra whitespace and tokenize
    tokens = cleaned.split()

    if not tokens:
        return ""

    # 7, 8, 9, 11, 12: Filter stopwords and lemmatize, keeping emotional & Hinglish words
    processed_tokens = []
    for token in tokens:
        token = token.strip()
        if not token:
            continue

        # Skip stopwords unless they are preserved emotional words
        if token in EFFECTIVE_STOPWORDS:
            continue

        # Lemmatize
        lemma = lemmatize_word(token)
        processed_tokens.append(lemma)

    return " ".join(processed_tokens)


def get_meaningful_tokens(text: str) -> list[str]:
    """Tokenize and return clean tokens for scoring and analysis."""
    cleaned = clean_lyrics(text)
    return cleaned.split()
