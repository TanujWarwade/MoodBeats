import sqlite3

conn = sqlite3.connect('backend/data/music_mood.db')
c = conn.cursor()

BLOCKBUSTER_HITS = [
    'Kesariya', 'Apna Bana Le', 'Tum Kya Mile', 'Phir Aur Kya Chahiye', 'Jhoome Jo Pathaan',
    'Besharam Rang', 'What Jhumka', 'Ve Kamleya', 'Raataan Lambiyan', 'Tum Hi Ho',
    'Shayad', 'Kalank', 'Ghungroo', 'O Zaalima', 'Bekhayali', 'Tujhe Kitna Chahne',
    'Kun Faya Kun', 'Abhi Mujh Mein Kahin', 'Teri Ore', 'Pee Loon', 'Jeena Jeena',
    'Sajni', 'Dil Jhoom', 'Mainu Vida Karo', 'Nadaan Parinde', 'Agar Tum Saath Ho',
    'Agar Tum Mil Jao', 'Sanwaar Loon', 'Manjha', 'Khairiyat', 'Dil Diyan Gallan',
    'Kaala Chashma', 'Kar Gayi Chull', 'Matargashti', 'Taare Ginn', 'Rasiya',
    'Channa Mereya', 'Ae Dil Hai Mushkil', 'Gerua', 'Ilahi', 'Subhanallah',
    'Deva Deva', 'Pee Loon', 'Hawayein', 'Zaalima', 'Kabira', 'Balam Pichkari'
]

TOP_SINGERS = [
    'Arijit Singh', 'Atif Aslam', 'KK', 'Shreya Ghoshal', 'Pritam',
    'Sonu Nigam', 'Mohit Chauhan', 'Jubin Nautiyal', 'Diljit Dosanjh',
    'Badshah', 'Neha Kakkar', 'Sid Sriram', 'Sunidhi Chauhan',
    'Armaan Malik', 'Darshan Raval', 'Rahat Fateh Ali Khan',
    'Vishal Dadlani', 'Shekhar Ravjiani', 'Sachin-Jigar', 'Lucky Ali'
]

hit_whens = " ".join([f"WHEN music_name LIKE '%{kw}%' THEN 14.0" for kw in BLOCKBUSTER_HITS])
singer_whens = " ".join([f"WHEN singer LIKE '%{s}%' THEN 6.0" for s in TOP_SINGERS])

sql = f"""
SELECT id, music_name, singer, release, song_rating, youtube_id,
(
    COALESCE(song_rating, 0) * 1.5
    + (CASE {hit_whens} ELSE 0.0 END)
    + (CASE {singer_whens} ELSE 0.0 END)
    + (CASE 
        WHEN release >= 2023 THEN 6.0
        WHEN release >= 2022 THEN 5.0
        WHEN release >= 2021 THEN 4.0
        WHEN release >= 2020 THEN 3.0
        WHEN release >= 2018 THEN 2.0
        WHEN release >= 2010 THEN 1.0
        ELSE 0.0 END)
    + (CASE WHEN youtube_id IS NOT NULL AND LENGTH(youtube_id) > 4 THEN 3.0 ELSE 0.0 END)
) as score
FROM songs
ORDER BY score DESC, release DESC, song_rating DESC
LIMIT 40
"""

c.execute(sql)
for idx, r in enumerate(c.fetchall(), 1):
    print(f"{idx}. [{r[3]}] {r[1]} - {r[2]} (Rating: {r[4]})")
