import urllib.request, json
res = urllib.request.urlopen('http://127.0.0.1:5000/api/discover?sort_by=trending&limit=15&offset=15')
data = json.loads(res.read())
print("API RETURNED SONGS (16-30):")
for i, s in enumerate(data['songs'], 16):
    print(f"{i}. {s['music_name']} - {s['singer']} ({s['release']})")
