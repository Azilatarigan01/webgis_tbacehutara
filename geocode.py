import requests
import json
import time

kecamatans = [
    'Nisam', 'Paya Bakong', 'Seunuddon', 'Syamtalira Aron', 'Syamtalira Bayu',
    'Tanah Pasir', 'Pirak Timur', 'Samudera', 'Lapang', 'Baktiya',
    'Nibong', 'Tanah Luas', 'Lhoksukon', 'Meurah Mulia', 'Matangkuli',
    'Geuredong Pase', 'Muara Batu', 'Baktiya Barat', 'Kuta Makmur', 'Langkahan',
    'Cot Girek', 'Sawang', 'Dewantara', 'Banda Baro', 'Simpang Kramat', 'Nisam Antara',
    'Tanah Jambo Aye'
]

results = {}
for kec in kecamatans:
    url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'
    params = {
        'f': 'json',
        'singleLine': f'{kec}, Aceh Utara, Indonesia',
        'maxLocations': 1
    }
    try:
        r = requests.get(url, params=params)
        data = r.json()
        if data.get('candidates'):
            loc = data['candidates'][0]['location']
            results[kec] = {'lat': loc['y'], 'lon': loc['x']}
            print(f'{kec}: {loc["y"]}, {loc["x"]}')
        else:
            print(f'{kec}: FAILED')
    except Exception as e:
        print(f'{kec}: ERROR: {e}')
    time.sleep(0.2)

with open('kecamatan_coords.json', 'w') as f:
    json.dump(results, f, indent=4)
print("Done! Saved to kecamatan_coords.json")
