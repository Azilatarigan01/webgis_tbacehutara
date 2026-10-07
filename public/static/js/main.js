// Global variables
let lisaMap, prophetMap;
let lisaGeojsonLayer = null;
let prophetGeojsonLayer = null;
let acehUtaraGeoJSON = null;
let lisaData = [];
let prophetSpatialData = [];
let moranChart = null;
let prophetTrendChart = null;
let currentCategoryFilter = 'all';

// Center coordinates for Aceh Utara
const ACEH_UTARA_CENTER = [5.08, 97.18];
const DEFAULT_ZOOM = 10;

// Cluster styling colors (bold, solid, non-faded colors matching reference image)
const CLUSTER_COLORS = {
    'HH': '#ef4444', // Red
    'HL': '#f97316', // Orange
    'LH': '#3b82f6', // Light Blue
    'LL': '#0ea5e9', // Blue
    'NS': '#64748b'  // Grey/Slate
};

// Map Tile Layer configurations
const TILE_URLS = {
    dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

let lisaTileLayer = null;
let prophetTileLayer = null;

// Chart theme helper
function updateChartThemes(theme) {
    const textColor = theme === 'light' ? '#334155' : '#94a3b8';
    const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    
    [moranChart, prophetTrendChart].forEach(chart => {
        if (chart) {
            if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            if (chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.grid.color = gridColor;
                    chart.options.scales.x.ticks.color = textColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.grid.color = gridColor;
                    chart.options.scales.y.ticks.color = textColor;
                }
            }
            chart.update();
        }
    });
}

// Set system date and update in real-time
function updateLiveTime() {
    const now = new Date();
    
    // Format: Hari, DD Bulan YYYY (e.g., Minggu, 28 Juni 2026)
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
    
    // Format: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;
    
    const liveTimeEl = document.getElementById('live-time');
    if (liveTimeEl) {
        liveTimeEl.innerText = `${dateStr} | ${timeStr} WIB`;
    }
}
updateLiveTime();
setInterval(updateLiveTime, 1000);


document.addEventListener('DOMContentLoaded', () => {
    // Tab switching listener
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Theme Toggle Handler
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    function updateThemeIcon(theme) {
        if (theme === 'light') {
            themeIcon.className = 'fa-solid fa-sun';
            themeToggleBtn.setAttribute('title', 'Aktifkan Mode Gelap');
        } else {
            themeIcon.className = 'fa-solid fa-moon';
            themeToggleBtn.setAttribute('title', 'Aktifkan Mode Terang');
        }
    }
    
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(initialTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Update map tile layers
        if (lisaTileLayer) {
            lisaTileLayer.setUrl(TILE_URLS[newTheme]);
        }
        if (prophetTileLayer) {
            prophetTileLayer.setUrl(TILE_URLS[newTheme]);
        }
        
        // Update Chart.js themes
        updateChartThemes(newTheme);
    });

    // Load initial data
    loadSummaryData();
    switchTab('overview');
});

function switchTab(tabId) {
    // Update active class in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update active class in content sections
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `tab-${tabId}`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Update Page Header Title & Subtitle
    const titleEl = document.getElementById('tab-title');
    const subtitleEl = document.getElementById('tab-subtitle');

    if (tabId === 'overview') {
        titleEl.innerText = "Dashboard Utama";
        subtitleEl.innerText = "Ringkasan Kondisi TB, Analisis Spasial, dan Forecasting 2026";
        loadSummaryData();
    } else if (tabId === 'moran') {
        titleEl.innerText = "Global Moran's I";
        subtitleEl.innerText = "Deteksi Hubungan Spasial (Autokorelasi) untuk Seluruh Wilayah";
        loadMoranData();
    } else if (tabId === 'lisa') {
        titleEl.innerText = "Kluster LISA (Local Moran's I)";
        subtitleEl.innerText = "Identifikasi Wilayah Hotspot, Coldspot, dan Outlier Kasus TB";
        loadLisaData();
        if (lisaMap) {
            setTimeout(() => { lisaMap.invalidateSize(); }, 200);
        }
    } else if (tabId === 'prophet') {
        titleEl.innerText = "Prediksi Tren & Spasial 2026";
        subtitleEl.innerText = "Prakiraan Kasus Tuberkulosis Tahun 2026 menggunakan Prophet";
        loadProphetData();
        if (prophetMap) {
            setTimeout(() => { prophetMap.invalidateSize(); }, 200);
        }
    }
}

// -------------------------------------------------------------
// TAB 1: SUMMARY / OVERVIEW
// -------------------------------------------------------------
function loadSummaryData() {
    fetch('/api/summary')
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            document.getElementById('summary-total-kec').innerText = `${data.total_kecamatan} Kecamatan`;
            document.getElementById('summary-pred-2026').innerText = `${data.total_prediksi_2026.toLocaleString('id-ID')} Kasus`;
            
            if (document.getElementById('summary-total-cases')) {
                document.getElementById('summary-total-cases').innerText = `${data.total_kasus_2021_2025.toLocaleString('id-ID')} Kasus`;
            }
            
            // Populate Moran's I card
            const year = data.latest_year || 2025;
            const spatialTitleEl = document.getElementById('summary-spatial-title');
            const spatialValEl = document.getElementById('summary-spatial-val');
            const spatialSubEl = document.getElementById('summary-spatial-sub');
            
            if (spatialTitleEl) spatialTitleEl.innerText = `Moran's I ${year}`;
            
            if (spatialValEl) {
                spatialValEl.innerText = data.latest_moran.toFixed(4);
            }
            
            if (spatialSubEl) {
                spatialSubEl.innerText = data.latest_moran_p < 0.05 ? "Ada Autokorelasi Spasial" : "Tidak ada Autokorelasi Spasial";
            }
        })
        .catch(err => console.error("Error loading summary:", err));
}

// -------------------------------------------------------------
// TAB 2: GLOBAL MORAN'S I
// -------------------------------------------------------------
function loadMoranData() {
    fetch('/api/moran')
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            
            // Populate Table
            const tbody = document.getElementById('moran-table-body');
            tbody.innerHTML = '';
            
            const years = [];
            const moranVals = [];
            
            data.forEach(row => {
                years.push(row.Tahun);
                moranVals.push(row.Moran_I);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${row.Tahun}</strong></td>
                    <td style="color: var(--accent-blue); font-weight:600;">${row.Moran_I.toFixed(5)}</td>
                    <td>${row['E(I)'] !== undefined && row['E(I)'] !== null ? row['E(I)'].toFixed(5) : '-'}</td>
                    <td>${row['Var(I)'] !== undefined && row['Var(I)'] !== null ? row['Var(I)'].toFixed(5) : '-'}</td>
                    <td>${row['Z-score'] !== undefined && row['Z-score'] !== null ? row['Z-score'].toFixed(5) : '-'}</td>
                    <td>${row['p-value'] !== undefined && row['p-value'] !== null ? row['p-value'].toFixed(5) : '-'}</td>
                    <td>
                        <span class="badge ${row['p-value'] < 0.05 ? 'badge-hh' : 'badge-ns'}">
                            ${row.Kesimpulan}
                        </span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Draw Chart
            renderMoranChart(years, moranVals);
        })
        .catch(err => console.error("Error loading Moran data:", err));
}

function renderMoranChart(labels, values) {
    const ctx = document.getElementById('moranChart').getContext('2d');
    if (moranChart) {
        moranChart.destroy();
    }
    
    moranChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Global Moran's I",
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#8b5cf6',
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { 
                        color: (document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#94a3b8'), 
                        font: { family: 'Outfit', size: 12 } 
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)') },
                    ticks: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#94a3b8') }
                },
                x: {
                    grid: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)') },
                    ticks: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#94a3b8') }
                }
            }
        }
    });
}

// -------------------------------------------------------------
// TAB 3: LISA CLUSTER MAP
// -------------------------------------------------------------
function loadLisaData() {
    // Prevent double map rendering
    if (!lisaMap) {
        lisaMap = L.map('lisaMap').setView(ACEH_UTARA_CENTER, DEFAULT_ZOOM);
        
        // Dynamic theme-based tile layer
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        lisaTileLayer = L.tileLayer(TILE_URLS[currentTheme], {
            attribution: TILE_ATTRIBUTION
        }).addTo(lisaMap);
        
        // Add legend
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <h4>Legenda Kluster</h4>
                <div class="legend-item"><span class="legend-color" style="background:${CLUSTER_COLORS.HH}"></span> HH (Hotspot - Tinggi)</div>
                <div class="legend-item"><span class="legend-color" style="background:${CLUSTER_COLORS.HL}"></span> HL (High Outlier)</div>
                <div class="legend-item"><span class="legend-color" style="background:${CLUSTER_COLORS.LH}"></span> LH (Low Outlier)</div>
                <div class="legend-item"><span class="legend-color" style="background:${CLUSTER_COLORS.LL}"></span> LL (Coldspot - Rendah)</div>
                <div class="legend-item"><span class="legend-color" style="background:${CLUSTER_COLORS.NS}"></span> NS (Not signifikan)</div>
            `;
            return div;
        };
        legend.addTo(lisaMap);
        setTimeout(() => { lisaMap.invalidateSize(); }, 200);
    }
    
    fetch('/api/lisa')
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            lisaData = data;
            
            // Populate year select dropdown
            const yearSelect = document.getElementById('lisa-year-select');
            const years = [...new Set(data.map(d => d.Tahun))].sort((a,b) => b-a);
            
            yearSelect.innerHTML = '';
            years.forEach(yr => {
                const opt = document.createElement('option');
                opt.value = yr;
                opt.innerText = yr;
                yearSelect.appendChild(opt);
            });
            
            updateLisaView();
        })
        .catch(err => console.error("Error loading LISA data:", err));
}

function updateLisaView() {
    const selectedYear = parseInt(document.getElementById('lisa-year-select').value);
    const filteredData = lisaData.filter(d => d.Tahun === selectedYear);
    
    // Clear old GeoJSON layer
    if (lisaGeojsonLayer) {
        lisaMap.removeLayer(lisaGeojsonLayer);
        lisaGeojsonLayer = null;
    }
    
    // Populate Table
    const tbody = document.getElementById('lisa-table-body');
    tbody.innerHTML = '';
    
    filteredData.forEach(row => {
        // Table population
        const tr = document.createElement('tr');
        const badgeClass = `badge-${row.Cluster.toLowerCase()}`;
        tr.innerHTML = `
            <td>${row.Tahun}</td>
            <td><strong>${row.Kecamatan}</strong></td>
            <td>${row.TB}</td>
            <td>${row.Local_I ? row.Local_I.toFixed(5) : '-'}</td>
            <td>${row['p-value'] ? row['p-value'].toFixed(5) : '-'}</td>
            <td><span class="badge ${badgeClass}">${row.Cluster || '-'}</span></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Plot GeoJSON polygons
    ensureGeoJSON().then(geojson => {
        if (!geojson) return;
        
        lisaGeojsonLayer = L.geoJSON(geojson, {
            style: function(feature) {
                const kecName = feature.properties.Kecamatan;
                const row = findRowForKec(filteredData, kecName);
                const color = row ? (CLUSTER_COLORS[row.Cluster] || CLUSTER_COLORS.NS) : CLUSTER_COLORS.NS;
                return {
                    fillColor: color,
                    weight: 1.5,
                    opacity: 1,
                    color: 'rgba(255, 255, 255, 0.65)',
                    fillOpacity: 0.65
                };
            },
            onEachFeature: function(feature, layer) {
                const kecName = feature.properties.Kecamatan;
                const row = findRowForKec(filteredData, kecName);
                
                if (row) {
                    const badgeClass = `badge-${row.Cluster.toLowerCase()}`;
                    const popupContent = `
                        <div class="custom-popup">
                            <div class="popup-title">Kec. ${row.Kecamatan} (${row.Tahun})</div>
                            <div class="popup-row"><span class="label">Jumlah Kasus TB:</span><span class="val">${row.TB}</span></div>
                            <div class="popup-row"><span class="label">Local Moran's I:</span><span class="val">${row.Local_I ? row.Local_I.toFixed(4) : '-'}</span></div>
                            <div class="popup-row"><span class="label">P-Value:</span><span class="val">${row['p-value'] ? row['p-value'].toFixed(4) : '-'}</span></div>
                            <div class="popup-row"><span class="label">Cluster:</span><span class="val"><span class="badge ${badgeClass}">${row.Cluster}</span></span></div>
                        </div>
                    `;
                    layer.bindPopup(popupContent);
                }
                
                layer.bindTooltip(kecName, {
                    permanent: false,
                    direction: 'center',
                    className: 'kecamatan-tooltip-polygon'
                });
                
                layer.on({
                    mouseover: function(e) {
                        const l = e.target;
                        l.setStyle({
                            fillOpacity: 0.85,
                            weight: 2.5,
                            color: '#ffffff'
                        });
                        l.bringToFront();
                    },
                    mouseout: function(e) {
                        lisaGeojsonLayer.resetStyle(e.target);
                    }
                });
            }
        }).addTo(lisaMap);
    });
    
    // Invalidate map size to make sure it loads correctly in hidden tab
    setTimeout(() => {
        lisaMap.invalidateSize();
    }, 100);
}

function filterLisaTable() {
    const searchVal = document.getElementById('lisa-search').value.toLowerCase();
    const rows = document.querySelectorAll('#lisa-table-body tr');
    rows.forEach(tr => {
        const kecName = tr.cells[1].innerText.toLowerCase();
        if (kecName.includes(searchVal)) {
            tr.style.display = '';
        } else {
            tr.style.display = 'none';
        }
    });
}

// -------------------------------------------------------------
// TAB 4: PROPHET PREDICTION 2026
// -------------------------------------------------------------
function loadProphetData() {
    // Map setup
    if (!prophetMap) {
        prophetMap = L.map('prophetMap').setView(ACEH_UTARA_CENTER, DEFAULT_ZOOM);
        
        // Dynamic theme-based tile layer
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        prophetTileLayer = L.tileLayer(TILE_URLS[currentTheme], {
            attribution: TILE_ATTRIBUTION
        }).addTo(prophetMap);
        
        // Add legend for High / Med / Low
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <h4>Tingkat Kerawanan (CNR)</h4>
                <div class="legend-item"><span class="legend-color" style="background:#ef4444"></span> Tinggi (Red)</div>
                <div class="legend-item"><span class="legend-color" style="background:#d97706"></span> Sedang (Orange)</div>
                <div class="legend-item"><span class="legend-color" style="background:#22c55e"></span> Rendah (Green)</div>
            `;
            return div;
        };
        legend.addTo(prophetMap);
        setTimeout(() => { prophetMap.invalidateSize(); }, 200);
    }
    
    // 1. Load spatial CNR data
    fetch('/api/prophet_spatial')
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            prophetSpatialData = data;
            
            // Clear old GeoJSON layer
            if (prophetGeojsonLayer) {
                prophetMap.removeLayer(prophetGeojsonLayer);
                prophetGeojsonLayer = null;
            }
            
            let tinggiCount = 0;
            let sedangCount = 0;
            let rendahCount = 0;
            
            data.forEach(row => {
                const kat = row.Kategori_WebGIS.toLowerCase();
                if (kat === 'tinggi') tinggiCount++;
                else if (kat === 'sedang') sedangCount++;
                else if (kat === 'rendah') rendahCount++;
            });
            
            // Draw GeoJSON layer for boundaries
            ensureGeoJSON().then(geojson => {
                if (!geojson) return;
                
                prophetGeojsonLayer = L.geoJSON(geojson, {
                    style: function(feature) {
                        const kecName = feature.properties.Kecamatan;
                        const row = findRowForKec(prophetSpatialData, kecName);
                        const color = row ? (row.Warna_Hex || '#64748b') : '#64748b';
                        return {
                            fillColor: color,
                            weight: 1.5,
                            opacity: 1,
                            color: 'rgba(255, 255, 255, 0.65)',
                            fillOpacity: 0.65
                        };
                    },
                    onEachFeature: function(feature, layer) {
                        const kecName = feature.properties.Kecamatan;
                        const row = findRowForKec(prophetSpatialData, kecName);
                        
                        if (row) {
                            const badgeClass = `badge-${row.Kategori_WebGIS.toLowerCase()}`;
                            const popupContent = `
                                <div class="custom-popup">
                                    <div class="popup-title">Prediksi Kec. ${row.Kecamatan} 2026</div>
                                    <div class="popup-row"><span class="label">Populasi Estimasi:</span><span class="val">${row.Populasi.toLocaleString('id-ID')}</span></div>
                                    <div class="popup-row"><span class="label">Prediksi Kasus TB:</span><span class="val">${row.Kasus_2026_Bulat}</span></div>
                                    <div class="popup-row"><span class="label">CNR 2026:</span><span class="val">${row.CNR_2026.toFixed(2)}</span></div>
                                    <div class="popup-row"><span class="label">Kategori:</span><span class="val"><span class="badge ${badgeClass}">${row.Kategori_WebGIS}</span></span></div>
                                </div>
                            `;
                            layer.bindPopup(popupContent);
                        }
                        
                        layer.bindTooltip(kecName, {
                            permanent: false,
                            direction: 'center',
                            className: 'kecamatan-tooltip-polygon'
                        });
                        
                        layer.on({
                            mouseover: function(e) {
                                const l = e.target;
                                l.setStyle({
                                    fillOpacity: 0.85,
                                    weight: 2.5,
                                    color: '#ffffff'
                                });
                                l.bringToFront();
                            },
                            mouseout: function(e) {
                                const kecN = e.target.feature.properties.Kecamatan;
                                const r = findRowForKec(prophetSpatialData, kecN);
                                if (r) {
                                    const searchVal = document.getElementById('prophet-spatial-search') ? document.getElementById('prophet-spatial-search').value.toLowerCase() : '';
                                    const matchesSearch = r.Kecamatan.toLowerCase().includes(searchVal);
                                    const matchesCategory = (currentCategoryFilter === 'all' || r.Kategori_WebGIS.toLowerCase() === currentCategoryFilter);
                                    if (matchesSearch && matchesCategory) {
                                        e.target.setStyle({
                                            fillColor: r.Warna_Hex,
                                            weight: 1.5,
                                            opacity: 1,
                                            color: 'rgba(255, 255, 255, 0.65)',
                                            fillOpacity: 0.65
                                        });
                                    } else {
                                        e.target.setStyle({
                                            fillColor: '#94a3b8',
                                            weight: 1.0,
                                            opacity: 0.15,
                                            color: 'rgba(255, 255, 255, 0.2)',
                                            fillOpacity: 0.05
                                        });
                                    }
                                }
                            }
                        });
                    }
                }).addTo(prophetMap);
                
                // Initialize Table once layer is ready
                updateProphetSpatialView();
            });
            
            // Update counts in dashboard cards
            document.getElementById('prophet-tinggi-count').innerText = tinggiCount;
            document.getElementById('prophet-sedang-count').innerText = sedangCount;
            document.getElementById('prophet-rendah-count').innerText = rendahCount;
            
            setTimeout(() => {
                prophetMap.invalidateSize();
            }, 100);
        })
        .catch(err => console.error("Error loading Prophet spatial data:", err));
        
    // 2. Load monthly trend data
    fetch('/api/prophet_trend')
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            
            const labels = [];
            const yhat = [];
            const yhatLower = [];
            const yhatUpper = [];
            
            const translations = {
                "January": "Januari", "February": "Februari", "March": "Maret",
                "April": "April", "May": "Mei", "June": "Juni",
                "July": "Juli", "August": "Agustus", "September": "September",
                "October": "Oktober", "November": "November", "December": "Desember"
            };
            
            data.forEach(row => {
                let label = row.Bulan;
                if (row.Bulan) {
                    const monthPart = row.Bulan.split(' ')[0];
                    const translatedMonth = translations[monthPart] || monthPart;
                    label = translatedMonth;
                }
                
                labels.push(label);
                yhat.push(row.Prediksi);
                yhatLower.push(row.Batas_Bawah);
                yhatUpper.push(row.Batas_Atas);
            });
            
            renderProphetTrendChart(labels, yhat, yhatLower, yhatUpper);
        })
        .catch(err => console.error("Error loading Prophet trend data:", err));
}

function renderProphetTrendChart(labels, yhat, lower, upper) {
    const ctx = document.getElementById('prophetTrendChart').getContext('2d');
    if (prophetTrendChart) {
        prophetTrendChart.destroy();
    }
    
    prophetTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Estimasi Kasus (Rata-rata)",
                    data: yhat,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.2,
                    zIndex: 10
                },
                {
                    label: "Batas Bawah (Lower)",
                    data: lower,
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.2
                },
                {
                    label: "Batas Atas (Upper)",
                    data: upper,
                    borderColor: 'rgba(34, 197, 94, 0.4)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { 
                        color: (document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#94a3b8'), 
                        font: { family: 'Outfit', size: 11 } 
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)') },
                    ticks: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#94a3b8') }
                },
                x: {
                    grid: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)') },
                    ticks: { color: (document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#94a3b8') }
                }
            }
        }
    });
}

function updateProphetSpatialView() {
    const searchVal = document.getElementById('prophet-spatial-search') ? document.getElementById('prophet-spatial-search').value.toLowerCase() : '';
    const sortBy = document.getElementById('prophet-table-sort') ? document.getElementById('prophet-table-sort').value : 'rate_desc';
    
    let visibleCount = 0;
    const tbody = document.getElementById('prophet-spatial-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Sort a copy of prophetSpatialData
    const sortedData = [...prophetSpatialData];
    if (sortBy === 'rate_desc') {
        sortedData.sort((a, b) => b.CNR_2026 - a.CNR_2026);
    } else if (sortBy === 'cases_desc') {
        sortedData.sort((a, b) => b.Kasus_2026_Bulat - a.Kasus_2026_Bulat);
    } else if (sortBy === 'category_desc') {
        const weight = { 'Tinggi': 3, 'Sedang': 2, 'Rendah': 1 };
        sortedData.sort((a, b) => {
            const wA = weight[a.Kategori_WebGIS] || 0;
            const wB = weight[b.Kategori_WebGIS] || 0;
            if (wB !== wA) return wB - wA;
            return b.CNR_2026 - a.CNR_2026;
        });
    } else if (sortBy === 'name_asc') {
        sortedData.sort((a, b) => a.Kecamatan.localeCompare(b.Kecamatan));
    }
    
    sortedData.forEach(row => {
        const matchesSearch = row.Kecamatan.toLowerCase().includes(searchVal);
        const matchesCategory = (currentCategoryFilter === 'all' || row.Kategori_WebGIS.toLowerCase() === currentCategoryFilter);
        
        if (matchesSearch && matchesCategory) {
            visibleCount++;
            const tr = document.createElement('tr');
            const badgeClass = `badge-${row.Kategori_WebGIS.toLowerCase()}`;
            tr.innerHTML = `
                <td style="text-align: center; color: var(--text-secondary);">${visibleCount}</td>
                <td><strong>${row.Kecamatan}</strong></td>
                <td>${row.Populasi.toLocaleString('id-ID')}</td>
                <td style="font-weight: 600;">${row.Kasus_2026_Bulat}</td>
                <td style="color: var(--accent-blue); font-weight: 600;">${row.CNR_2026.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${row.Kategori_WebGIS}</span></td>
            `;
            tbody.appendChild(tr);
        }
    });
    
    const countEl = document.getElementById('filtered-count');
    if (countEl) {
        countEl.innerText = `Menampilkan ${visibleCount} kecamatan`;
    }
    
    // Dynamically update polygon styling on the map based on filters
    if (prophetGeojsonLayer) {
        prophetGeojsonLayer.setStyle(function(feature) {
            const kecName = feature.properties.Kecamatan;
            const row = findRowForKec(prophetSpatialData, kecName);
            if (!row) return { fillOpacity: 0, opacity: 0 };
            
            const matchesSearch = row.Kecamatan.toLowerCase().includes(searchVal);
            const matchesCategory = (currentCategoryFilter === 'all' || row.Kategori_WebGIS.toLowerCase() === currentCategoryFilter);
            
            if (matchesSearch && matchesCategory) {
                return {
                    fillColor: row.Warna_Hex || '#64748b',
                    weight: 1.5,
                    opacity: 1,
                    color: 'rgba(255, 255, 255, 0.65)',
                    fillOpacity: 0.65
                };
            } else {
                return {
                    fillColor: '#94a3b8',
                    weight: 1.0,
                    opacity: 0.15,
                    color: 'rgba(255, 255, 255, 0.2)',
                    fillOpacity: 0.05
                };
            }
        });
    }
}

function setCategoryFilter(filterValue) {
    currentCategoryFilter = filterValue;
    
    const buttons = document.querySelectorAll('#category-filter-container .filter-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-filter') === filterValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updateProphetSpatialView();
}

function filterProphetSpatialTable() {
    updateProphetSpatialView();
}

function exportPDF() {
    window.print();
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR SHAPEFILE BOUNDARIES MAPS
// -------------------------------------------------------------

function ensureGeoJSON() {
    if (acehUtaraGeoJSON) {
        return Promise.resolve(acehUtaraGeoJSON);
    }
    return fetch('/static/aceh_utara.geojson')
        .then(res => res.json())
        .then(data => {
            acehUtaraGeoJSON = data;
            return acehUtaraGeoJSON;
        })
        .catch(err => {
            console.error("Error loading GeoJSON shapefile:", err);
            return null;
        });
}

function normalizeKecName(name) {
    if (!name) return "";
    let n = name.toLowerCase().trim();
    n = n.replace(/\s+/g, ' '); // remove multiple spaces
    n = n.replace(/[^a-z0-9]/g, ''); // strip non-alphanumeric (removes dots, spaces, hyphens)
    
    // Custom overrides for known different spelling/formats between datasets:
    if (n === 'geuredongpase' || n === 'geureudongpase') return 'geureudongpase';
    if (n === 'piraktimur' || n === 'piraktimu') return 'piraktimur';
    if (n === 'tjamboaye' || n === 'tanahjamboaye') return 'tanahjamboaye';
    
    return n;
}

function findRowForKec(dataList, kecName) {
    const normSearch = normalizeKecName(kecName);
    return dataList.find(d => normalizeKecName(d.Kecamatan) === normSearch);
}

