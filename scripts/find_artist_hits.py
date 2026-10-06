import sqlite3

conn = sqlite3.connect('backend/data/music_mood.db')
c = conn.cursor()

artists = ['KK', 'Sonu Nigam', 'Atif Aslam', 'Mohit Chauhan', 'Diljit Dosanjh', 'Badshah', 'Neha Kakkar', 'Sid Sriram', 'A.R. Rahman', 'Pritam']
for art in artists:
    c.execute(f"SELECT music_name, singer, release, song_rating, youtube_id FROM songs WHERE singer LIKE '%{art}%' AND song_rating >= 4.0 ORDER BY release DESC, song_rating DESC LIMIT 4")
    rows = c.fetchall()
    print(f"=== {art} ===")
    for r in rows:
        print(f"  [{r[2]}] {r[0]} ({r[3]}) [YT: {r[4]}]")
