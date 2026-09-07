# Panduan Pengujian Otomatis dengan Cypress

Repositori ini telah dikonfigurasi dengan pengujian otomatis antarmuka (UI) menggunakan **Cypress**. Pengujian ini memvalidasi navigasi tab, pemfilteran tabel, pencarian data, penggantian tema warna, dan ketersediaan tombol ekspor laporan.

## Prasyarat
Sebelum memulai, pastikan perangkat Anda memiliki:
1. **Node.js** (rekomendasi versi LTS terbaru, minimal v18+). Perangkat Anda saat ini terdeteksi menggunakan Node.js **v22.14.0**.
2. **Python 3.x** dan *virtual environment* yang sudah terkonfigurasi untuk menjalankan server Flask.

---

## Langkah Setup & Instalasi

### 1. Instalasi Cypress dan Dependencies
Buka terminal/command prompt di folder root proyek ini, kemudian jalankan perintah berikut untuk mengunduh dan menginstal Cypress secara lokal:

```bash
npm install
```

Perintah di atas akan menginstal Cypress dan mendownload binary pendukung yang dibutuhkan di folder `node_modules`.

---

## Cara Menjalankan Pengujian

### Langkah 1: Pastikan Server Flask Aktif
Pastikan aplikasi backend Flask Anda sedang berjalan. Jika belum, aktifkan virtual environment Anda dan jalankan aplikasi:

```bash
# Contoh mengaktifkan venv (sesuaikan dengan environment Anda)
# .venv\Scripts\activate

# Jalankan Flask App
python app.py
```

Secara default, aplikasi akan berjalan pada alamat **`http://127.0.0.1:5000`**.

### Langkah 2: Jalankan Tes Cypress

Terdapat dua cara untuk menjalankan pengujian:

#### A. Mode Headless (Menjalankan tes di terminal tanpa membuka browser)
Gunakan perintah ini untuk eksekusi cepat langsung di dalam terminal. Berguna untuk CI/CD atau pemeriksaan berkala.

```bash
npm run test:run
```

Cypress akan menjalankan seluruh tes di latar belakang dan menampilkan ringkasan hasil (Passed/Failed) di terminal Anda.

#### B. Mode GUI Interaktif (Membuka Cypress Test Runner)
Gunakan perintah ini jika Anda ingin melihat secara visual bagaimana browser dikendalikan secara otomatis oleh Cypress dan melihat jalannya tes langkah demi langkah.

```bash
npm run test:open
```

Setelah jendela Cypress terbuka:
1. Pilih **E2E Testing**.
2. Pilih browser yang ingin digunakan (misalnya **Chrome** atau **Electron**), lalu klik **Start E2E Testing**.
3. Di daftar spesifikasi tes, klik berkas **`dashboard.cy.js`**.
4. Cypress akan membuka jendela browser baru dan melakukan pengujian otomatis secara interaktif.

---

## Struktur File Tes
- **`cypress.config.js`**: File konfigurasi utama Cypress (berisi URL target server, resolusi layar, dll).
- **`cypress/e2e/dashboard.cy.js`**: Berisi seluruh kode pengujian untuk memvalidasi interaksi UI dashboard.
- **`cypress/support/e2e.js`**: Konfigurasi global sebelum pengujian dijalankan.
