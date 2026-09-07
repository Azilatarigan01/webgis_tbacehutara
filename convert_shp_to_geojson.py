import os
import json
import geopandas as gpd

def main():
    print("Memulai konversi Shapefile ke GeoJSON...")
    
    # Konfigurasi GDAL untuk membuat ulang file index (.shx) secara otomatis jika diperlukan
    os.environ['SHAPE_RESTORE_SHX'] = 'YES'
    
    shp_path = 'Aceh Utara.shp'
    geojson_path = os.path.join('static', 'aceh_utara.geojson')
    
    if not os.path.exists(shp_path):
        print(f"Error: Berkas '{shp_path}' tidak ditemukan di direktori saat ini.")
        return
        
    # Membaca Shapefile
    gdf = gpd.read_file(shp_path)
    
    # Pemetaan indeks baris dari berkas SHP ke nama Kecamatan di Aceh Utara
    # Ini didasarkan pada analisis koordinat spasial centroid & titik koordinat kecamatan_coords.json
    mapping = {
        0: "Baktiya",
        1: "Dewantara",
        2: "Kuta Makmur",
        3: "Lhoksukon",
        4: "Matangkuli",
        5: "Muara Batu",
        6: "Meurah Mulia",
        7: "Samudera",
        8: "Seunuddon",
        9: "Syamtalira Aron",
        10: "Syamtalira Bayu",
        11: "Tanah Luas",
        12: "Tanah Pasir",
        13: "T. Jambo Aye",  # Sinonim dari Tanah Jambo Aye
        14: "Sawang",
        15: "Nisam",
        16: "Cot Girek",
        17: "Langkahan",
        18: "Baktiya Barat",
        19: "Paya Bakong",
        20: "Nibong",
        21: "Simpang Kramat",
        22: "Lapang",
        23: "Pirak Timur",
        24: "Geuredong Pase",
        25: "Banda Baro",
        26: "Nisam Antara"
    }
    
    # Memasukkan nama kecamatan ke dalam properti GeoDataFrame
    gdf['Kecamatan'] = gdf.index.map(mapping)
    
    # Memastikan format koordinat memakai sistem koordinat geografis standar WGS 84 (EPSG:4326) untuk Leaflet
    if gdf.crs is None or gdf.crs.to_string() != 'EPSG:4326':
        print("Mengatur ulang sistem koordinat proyeksi ke EPSG:4326...")
        gdf = gdf.set_crs('EPSG:4326', allow_override=True)
    
    # Memastikan folder output static sudah ada
    os.makedirs(os.path.dirname(geojson_path), exist_ok=True)
    
    # Ekspor ke GeoJSON format
    print(f"Menyimpan hasil ke '{geojson_path}'...")
    gdf.to_file(geojson_path, driver='GeoJSON')
    print("Konversi sukses! Peta batas wilayah berhasil dibuat.")

if __name__ == '__main__':
    main()
