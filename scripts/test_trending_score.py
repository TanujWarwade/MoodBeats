import sqlite3

conn = sqlite3.connect('backend/data/music_mood.db')
c = conn.cursor()

# Iconic superhit keywords
SUPERHIT_KEYWORDS = [
    'Kesariya', 'Apna Bana Le', 'Tum Kya Mile', 'Phir Aur Kya Chahiye', 'Jhoome Jo Pathaan',
    'Besharam Rang', 'What Jhumka', 'Ve Kamleya', 'Raataan Lambiyan', 'Tum Hi Ho',
    'Shayad', 'Kalank', 'Ghungroo', 'O Zaalima', 'Bekhayali', 'Tujhe Kitna Chahne',
    'Kun Faya Kun', 'Abhi Mujh Mein Kahin', 'Teri Ore', 'Pee Loon', 'Jeena Jeena',
    'Sajni', 'Dil Jhoom', 'Mainu Vida Karo', 'Nadaan Parinde', 'Agar Tum Saath Ho',
    'Agar Tum Mil Jao', 'Sanwaar Loon', 'Manjha', 'Khairiyat', 'Rabba Janda'
]

# Top tier singers
A_TIER_SINGERS = [
    'Arijit Singh', 'Atif Aslam', 'KK', 'Shreya Ghoshal', 'Pritam',
    'Sonu Nigam', 'Mohit Chauhan', 'Jubin Nautiyal', 'Diljit Dosanjh',
    'Badshah', 'Neha Kakkar', 'Sid Sriram', 'Sunidhi Chauhan',
    'Armaan Malik', 'Darshan Raval', 'Rahat Fateh Ali Khan'
]

# Let's craft a SQL expression that scores:
# - Superhit song name match: +15
# - Tier-1 singer: +8
# - Release year recency: 2023 (+6), 2022 (+5), 2020 (+4), 2015 (+2)
# - Song rating: rating * 2
# - Has valid youtube_id (not empty): +3

hit_whens = " ".join([f"WHEN music_name LIKE '%{kw}%' THEN 15.0" for kw in SUPERHIT_KEYWORDS])
singer_whens = " ".join([f"WHEN singer LIKE '%{s}%' THEN 8.0" for s in A_TIER_SINGERS])

sql = f"""
SELECT id, music_name, singer, release, song_rating, youtube_id,
(
    COALESCE(song_rating, 0) * 2.0
    + (CASE {hit_whens} ELSE 0.0 END)
    + (CASE {singer_whens} ELSE 0.0 END)
    + (CASE 
        WHEN release >= 2023 THEN 6.0
        WHEN release >= 2022 THEN 5.0
        WHEN release >= 2020 THEN 4.0
        WHEN release >= 2015 THEN 2.0
        WHEN release >= 2010 THEN 1.0
        ELSE 0.0 END)
    + (CASE WHEN youtube_id IS NOT NULL AND LENGTH(youtube_id) > 4 THEN 3.0 ELSE 0.0 END)
) as trending_score
FROM songs
ORDER BY trending_score DESC, release DESC
LIMIT 30
"""

c.execute(sql)
results = c.fetchall()

print("--- TOP 30 SONGS WITH NEW SCORING ---")
for r in results:
    print(f"[{r[3]}] {r[1]} - {r[2]} (Score: {r[6]:.1f}) [YT: {r[5]}]")
