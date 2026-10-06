import sqlite3

conn = sqlite3.connect('backend/data/music_mood.db')
c = conn.cursor()

checks = ['Kesariya', 'Apna Bana', 'Raataan', 'Channa', 'Tum Hi Ho', 'Ghungroo', 'Lut Gaye', 'Shayad', 'Kalank', 'Kabir Singh', 'Bekhayali', 'Tujhe Kitna', 'Agar Tum', 'Tera Ban', 'Hawayein', 'Zaalima']
for name in checks:
    c.execute(f"SELECT id, music_name, singer, release, song_rating FROM songs WHERE music_name LIKE '%{name}%' LIMIT 3")
    rows = c.fetchall()
    print(f"Query: {name} -> {len(rows)} results")
    for r in rows:
        print(f"   [{r[3]}] {r[1]} - {r[2]} ({r[4]})")
