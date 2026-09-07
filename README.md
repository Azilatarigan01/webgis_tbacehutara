# 🗺️ WebGIS & Spatial Forecasting of Tuberculosis (TBC) - Kabupaten Aceh Utara

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Leaflet.js-GIS-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Prophet-Forecasting-blue?style=for-the-badge" alt="Prophet" />
  <img src="https://img.shields.io/badge/Spatial-LISA%20%26%20Moran's%20I-orange?style=for-the-badge" alt="Moran" />
</p>

---

## 🔗 Live Demo
> 🌐 **Kunjungi Demo Aplikasi:**  
> **[👉 Klik di Sini untuk Membuka WebGIS TBC Aceh Utara](https://webgis-tb-acehutara.onrender.com)**  
> *(Untuk demo instan saat server lokal aktif: [https://tangy-lizards-hang.loca.lt](https://tangy-lizards-hang.loca.lt))*

---

## 📖 Tentang Proyek

Sistem Informasi Geografis (WebGIS) interaktif berbasis web untuk **pemetaan spasial, analisis autokorelasi spasial, dan peramalan (forecasting) tren kasus Tuberkulosis (TBC)** di 27 Kecamatan di Kabupaten Aceh Utara.

Aplikasi ini dikembangkan sebagai bagian dari Tugas Akhir / Riset Analisis Data Spasial Epidemiologi untuk memfasilitasi pengambilan keputusan Dinas Kesehatan dalam strategi intervensi dan alokasi sumber daya pengendalian TBC.

---

## ✨ Fitur Unggulan

- 🗺️ **Peta Spasial Interaktif (Leaflet.js)**:
  - Visualisasi tematik *Choropleth* persebaran kasus TBC per kecamatan (2021–2025).
  - Layer switch: Peta Persebaran Kasus, Pola Spasial LISA, dan Klaster K-Means.
  - Filter interaktif per tahun & tooltip detail statistik per kecamatan.
- 📈 **Peramalan Kasus (Time-Series Forecasting)**:
  - Proyeksi kasus TBC tahun 2026 berbasis model **Facebook Prophet**.
- 📍 **Analisis Autokorelasi Spasial**:
  - **Global Moran's I**: Mengukur tingkat pengelompokan spasial global kasus TBC.
  - **LISA (Local Indicators of Spatial Association)**: Identifikasi klaster *High-High (Hotspot)*, *Low-Low (Coldspot)*, *High-Low*, dan *Low-High Outliers*.
- 📊 **Pengelompokan Wilayah (K-Means Clustering)**:
  - Segmentasi kecamatan berbasis tingkat keparahan dan kebutuhan alokasi intervensi.
- 📄 **Export Laporan PDF Dinamis**:
  - Unduh rekapitulasi data epidemiologi dan hasil analisis spasial dalam format PDF standar resmi via ReportLab.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi |
| :--- | :--- |
| **Backend** | Python, Flask |
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism UI), JavaScript (ES6+), Leaflet.js |
| **Data & Analisis** | Pandas, OpenPyXL, GeoJSON, Shapefile (SHP) |
| **Spatial Modeling** | Global Moran's I, LISA Analysis, K-Means Clustering, Prophet Forecasting |
| **Export Generator** | ReportLab (PDF Engine) |

---

## 📁 Struktur Direktori

```text
webgistb_acehutara/
│
├── app.py                             # Server utama Flask & API Endpoints
├── requirements.txt                   # Daftar dependensi Python
├── Procfile                           # Konfigurasi deployment server
├── .gitignore                         # File pengabaian Git
│
├── static/
│   ├── css/                           # Styling aplikasi
│   ├── js/                            # Skrip interaktivitas peta & visualisasi
│   └── aceh_utara.geojson             # Data batas spasial wilayah Aceh Utara
│
├── templates/
│   └── index.html                     # Tampilan utama Dashboard WebGIS
│
└── data/ & spreadsheets               # Dataset kasus, koordinat, dan output analisis
    ├── tbkecamatan.csv
    ├── kecamatan_coords.json
    ├── hasil_analisis_prophet (1).xlsx
    ├── hasil_analisis_spasial_TB_2021_2025.xlsx
    ├── hasil_global_moran.xlsx
    ├── hasil_lisa_detail.xlsx
    └── hasil_geb_kmeans_2026.xlsx
```

---

## 🚀 Panduan Menjalankan di Lokal (Local Setup)

### 1. Clone Repository
```bash
git clone https://github.com/Azilatarigan01/webgis_tbacehutara.git
cd webgis_tbacehutara
```

### 2. Buat & Aktifkan Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependensi
```bash
pip install -r requirements.txt
```

### 4. Jalankan Aplikasi
```bash
python app.py
```
Buka browser dan akses: `http://127.0.0.1:5000`

---

## 👩‍💻 Pengembang / Peneliti
- **Nama**: Nur Azila Tarigan
- **Topik Riset**: Forecasting & Spatial Analysis of Tuberculosis in Aceh Utara
- **Institusi**: Tugas Akhir (TGA)

---

⭐ *Jangan lupa beri bintang jika repositori ini bermanfaat!*
