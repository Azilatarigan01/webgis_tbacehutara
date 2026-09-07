import os
import json
import io
import pandas as pd
from flask import Flask, jsonify, render_template, send_file
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = Flask(__name__)

# Load coordinates
COORDS_FILE = 'kecamatan_coords.json'
with open(COORDS_FILE, 'r') as f:
    kecamatan_coords = json.load(f)

# Helper function to sanitize float values (handling NaN or Inf which aren't valid JSON)
def sanitize_data(df):
    # Replace NaN with None so it translates to null in JSON
    df_clean = df.copy()
    for col in df_clean.columns:
        if df_clean[col].dtype in ['float64', 'float32']:
            df_clean[col] = df_clean[col].apply(lambda x: None if pd.isna(x) else x)
        elif df_clean[col].dtype in ['int64', 'int32']:
            df_clean[col] = df_clean[col].apply(lambda x: None if pd.isna(x) else int(x))
    return df_clean

def standardize_kecamatan(name):
    if not isinstance(name, str):
        return name
    n = name.strip()
    nl = n.lower()
    if nl == 'lhoksukun':
        return 'Lhoksukon'
    if nl in ['simpang keramat', 'simpang kramat']:
        return 'Simpang Kramat'
    return n

def normalize_kec_name(name):
    if not name or not isinstance(name, str):
        return ""
    import re
    n = re.sub(r'[^a-z0-9]', '', name.lower().strip())
    if n in ['geuredongpase', 'geureudongpase']:
        return 'geureudongpase'
    if n in ['piraktimur', 'piraktimu']:
        return 'piraktimur'
    if n in ['tjamboaye', 'tanahjamboaye', 't.jamboaye']:
        return 'tanahjamboaye'
    if n in ['simpangkeramat', 'simpangkramat']:
        return 'simpangkramat'
    return n

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/summary')
def get_summary():
    try:
        moran_df = pd.read_excel('hasil_analisis_spasial_TB_2021_2025.xlsx', sheet_name='Global_Moran')
        if 'Variance_Simulation' not in moran_df.columns and 'Z_Simulation' in moran_df.columns:
            moran_df['Variance_Simulation'] = moran_df.apply(
                lambda row: ((row['Moran_I'] - row['Expected_I']) / row['Z_Simulation']) ** 2 if row['Z_Simulation'] != 0 else 0.0,
                axis=1
            )
        moran_df = moran_df.rename(columns={
            'Expected_I': 'E(I)',
            'Variance_Simulation': 'Var(I)',
            'Z_Simulation': 'Z-score',
            'P_Simulation': 'p-value'
        })
        
        lisa_df = pd.read_excel('hasil_analisis_spasial_TB_2021_2025.xlsx', sheet_name='Detail_LISA').rename(columns={
            'kecamatan': 'Kecamatan',
            'Kasus': 'TB',
            'Local_Moran_I': 'Local_I',
            'P_Simulation': 'p-value',
            'Cluster_LISA': 'Cluster',
            'Quadrant': 'Kuadran'
        })
        lisa_df['Kecamatan'] = lisa_df['Kecamatan'].apply(standardize_kecamatan)
        
        webgis_df = pd.read_excel('hasil_geb_kmeans_2026.xlsx', sheet_name='KMeans_Final')
        webgis_df['kecamatan'] = webgis_df['kecamatan'].apply(standardize_kecamatan)
        
        total_prediksi_2026 = int(webgis_df['Prediksi_2026'].round().sum()) if not webgis_df.empty else 0
        
        summary = {
            'total_kecamatan': max(len(lisa_df['Kecamatan'].unique()), len(webgis_df['kecamatan'].unique())),
            'lisa_years': sorted(list(map(int, lisa_df['Tahun'].unique()))),
            'latest_moran': float(moran_df.iloc[-1]['Moran_I']) if not moran_df.empty else 0.0,
            'latest_moran_p': float(moran_df.iloc[-1]['p-value']) if not moran_df.empty else 1.0,
            'latest_moran_conclusion': str(moran_df.iloc[-1]['Kesimpulan']) if not moran_df.empty else "N/A",
            'latest_year': int(moran_df.iloc[-1]['Tahun']) if not moran_df.empty else 2025,
            'total_prediksi_2026': total_prediksi_2026,
            'total_kasus_2021_2025': int(lisa_df['TB'].sum())
        }
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/moran')
def get_moran():
    try:
        df = pd.read_excel('hasil_analisis_spasial_TB_2021_2025.xlsx', sheet_name='Global_Moran')
        if 'Variance_Simulation' not in df.columns and 'Z_Simulation' in df.columns:
            df['Variance_Simulation'] = df.apply(
                lambda row: ((row['Moran_I'] - row['Expected_I']) / row['Z_Simulation']) ** 2 if row['Z_Simulation'] != 0 else 0.0,
                axis=1
            )
        df = df.rename(columns={
            'Expected_I': 'E(I)',
            'Variance_Simulation': 'Var(I)',
            'Z_Simulation': 'Z-score',
            'P_Simulation': 'p-value'
        })
        df_clean = sanitize_data(df)
        return jsonify(df_clean.to_dict(orient='records'))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lisa')
def get_lisa():
    try:
        df = pd.read_excel('hasil_analisis_spasial_TB_2021_2025.xlsx', sheet_name='Detail_LISA')
        df = df.rename(columns={
            'kecamatan': 'Kecamatan',
            'Kasus': 'TB',
            'Local_Moran_I': 'Local_I',
            'P_Simulation': 'p-value',
            'Cluster_LISA': 'Cluster',
            'Quadrant': 'Kuadran'
        })
        df['Kecamatan'] = df['Kecamatan'].apply(standardize_kecamatan)
        df_clean = sanitize_data(df)
        records = df_clean.to_dict(orient='records')
        
        # Inject coordinates
        for r in records:
            kec = r.get('Kecamatan', '').strip()
            coord = None
            norm_kec = normalize_kec_name(kec)
            for k, v in kecamatan_coords.items():
                if normalize_kec_name(k) == norm_kec:
                    coord = v
                    break
            if coord:
                r['lat'] = coord['lat']
                r['lon'] = coord['lon']
            else:
                r['lat'] = None
                r['lon'] = None
        
        return jsonify(records)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prophet_trend')
def get_prophet_trend():
    try:
        df = pd.read_excel('hasil_analisis_prophet (1).xlsx', sheet_name='Forecast_2026')
        df['Bulan'] = pd.to_datetime(df['ds']).dt.strftime('%B %Y')
        df = df.rename(columns={
            'Prediksi_Bulat': 'Prediksi',
        })
        df_clean = sanitize_data(df)
        return jsonify(df_clean.to_dict(orient='records'))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prophet_spatial')
def get_prophet_spatial():
    try:
        df = pd.read_excel('hasil_geb_kmeans_2026.xlsx', sheet_name='KMeans_Final')
        df['kecamatan'] = df['kecamatan'].apply(standardize_kecamatan)
        
        df_mapped = pd.DataFrame()
        df_mapped['Kecamatan'] = df['kecamatan']
        df_mapped['Populasi'] = df['Populasi_Referensi'].round().astype(int)
        df_mapped['Kasus_2026_Bulat'] = df['Prediksi_2026'].round().astype(int)
        df_mapped['CNR_2026'] = df['Rate_Prediksi_2026']
        df_mapped['Kategori_WebGIS'] = df['Kategori_Prediksi']
        
        color_map = {
            'Tinggi': '#ef4444',
            'Sedang': '#d97706',
            'Rendah': '#22c55e'
        }
        df_mapped['Warna_Hex'] = df['Kategori_Prediksi'].map(color_map)
        
        df_clean = sanitize_data(df_mapped)
        records = df_clean.to_dict(orient='records')
        
        # Inject coordinates using robust normalization
        for r in records:
            kec = r.get('Kecamatan', '').strip()
            coord = None
            norm_kec = normalize_kec_name(kec)
            for k, v in kecamatan_coords.items():
                if normalize_kec_name(k) == norm_kec:
                    coord = v
                    break
            if coord:
                r['lat'] = coord['lat']
                r['lon'] = coord['lon']
            else:
                r['lat'] = None
                r['lon'] = None
                
        return jsonify(records)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/excel')
def export_excel():
    try:
        df = pd.read_excel('hasil_geb_kmeans_2026.xlsx', sheet_name='KMeans_Final')
        df['kecamatan'] = df['kecamatan'].apply(standardize_kecamatan)
        
        df_mapped = pd.DataFrame()
        df_mapped['Kecamatan'] = df['kecamatan']
        df_mapped['Estimasi Populasi'] = df['Populasi_Referensi'].round().astype(int)
        df_mapped['Prediksi Kasus'] = df['Prediksi_2026'].round().astype(int)
        df_mapped['CNR 2026'] = df['Rate_Prediksi_2026'].round(2)
        df_mapped['Kategori Tingkat Kerawanan'] = df['Kategori_Prediksi']
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_mapped.to_excel(writer, sheet_name='Prediksi_2026', index=False)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='prediksi_tb_aceh_utara_2026.xlsx'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/spatial')
def export_spatial():
    try:
        geojson_path = 'prediksi_tb_aceh_utara_2026.geojson'
        if not os.path.exists(geojson_path):
            return jsonify({'error': 'GeoJSON file not found'}), 404
        return send_file(
            geojson_path,
            mimetype='application/geo+json',
            as_attachment=True,
            download_name='prediksi_tb_aceh_utara_2026.geojson'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/pdf')
def export_pdf():
    try:
        df = pd.read_excel('hasil_geb_kmeans_2026.xlsx', sheet_name='KMeans_Final')
        df['kecamatan'] = df['kecamatan'].apply(standardize_kecamatan)
        df_sorted = df.sort_values(by='Rate_Prediksi_2026', ascending=False)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            name='TitleStyle',
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            alignment=1,
            textColor=colors.HexColor('#0f172a')
        )
        
        subtitle_style = ParagraphStyle(
            name='SubtitleStyle',
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=1,
            textColor=colors.HexColor('#475569')
        )
        
        section_style = ParagraphStyle(
            name='SectionStyle',
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            textColor=colors.HexColor('#1e3a8a'),
            spaceBefore=10,
            spaceAfter=5
        )
        
        body_style = ParagraphStyle(
            name='BodyStyle',
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#334155')
        )
        
        table_header_style = ParagraphStyle(
            name='TableHeaderStyle',
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.white,
            alignment=1
        )
        
        table_body_style = ParagraphStyle(
            name='TableBodyStyle',
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0f172a')
        )

        table_body_bold_style = ParagraphStyle(
            name='TableBodyBoldStyle',
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0f172a')
        )
        
        story = []
        
        story.append(Paragraph("PEMERINTAH KABUPATEN ACEH UTARA", subtitle_style))
        story.append(Spacer(1, 2))
        story.append(Paragraph("DINAS KESEHATAN", title_style))
        story.append(Spacer(1, 2))
        story.append(Paragraph("LAPORAN HASIL PREDIKSI KASUS & RATE TUBERKULOSIS (TB) TAHUN 2026", title_style))
        story.append(Spacer(1, 10))
        
        line_data = [['']]
        line_table = Table(line_data, colWidths=[doc.width])
        line_table.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1.5, colors.HexColor('#0f172a')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(line_table)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("I. RINGKASAN KONDISI KABUPATEN ACEH UTARA", section_style))
        summary_data = [
            [
                Paragraph("<b>Total Kecamatan:</b> 27 Wilayah Analisis", body_style),
                Paragraph("<b>Total Kasus Historis (2021-2025):</b> 4.217 Kasus", body_style)
            ],
            [
                Paragraph("<b>Prediksi Kasus TB 2026:</b> 922 Kasus (Forecast)", body_style),
                Paragraph("<b>Indeks Global Moran's I (2025):</b> 0,0932 (Ada Autokorelasi)", body_style)
            ]
        ]
        summary_table = Table(summary_data, colWidths=[doc.width/2.0, doc.width/2.0])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("II. TABEL PREDIKSI CNR & TINGKAT KERAWANAN PER KECAMATAN (TAHUN 2026)", section_style))
        
        table_rows = [[
            Paragraph("<b>No.</b>", table_header_style),
            Paragraph("<b>Kecamatan</b>", table_header_style),
            Paragraph("<b>Estimasi Populasi</b>", table_header_style),
            Paragraph("<b>Prediksi Kasus</b>", table_header_style),
            Paragraph("<b>CNR 2026</b>", table_header_style),
            Paragraph("<b>Kategori Kerawanan</b>", table_header_style)
        ]]
        
        for idx, row in enumerate(df_sorted.itertuples(), 1):
            pop = int(row.Populasi_Referensi)
            cases = int(round(row.Prediksi_2026))
            cnr = float(row.Rate_Prediksi_2026)
            kat = str(row.Kategori_Prediksi)
            
            bg_color = '#e2e8f0'
            text_color = '#000000'
            if kat.lower() == 'tinggi':
                bg_color = '#fee2e2'
                text_color = '#991b1b'
            elif kat.lower() == 'sedang':
                bg_color = '#fef3c7'
                text_color = '#92400e'
            elif kat.lower() == 'rendah':
                bg_color = '#dcfce7'
                text_color = '#166534'
                
            kat_p_style = ParagraphStyle(
                name=f'KatStyle_{idx}',
                parent=table_body_style,
                fontName='Helvetica-Bold',
                alignment=1,
                textColor=colors.HexColor(text_color)
            )
            
            table_rows.append([
                Paragraph(str(idx), table_body_style),
                Paragraph(f"<b>{row.kecamatan}</b>", table_body_bold_style),
                Paragraph(f"{pop:,}".replace(',', '.'), table_body_style),
                Paragraph(str(cases), table_body_style),
                Paragraph(f"{cnr:.2f}".replace('.', ','), table_body_style),
                Paragraph(f"<font color='{text_color}'><b>{kat}</b></font>", kat_p_style)
            ])
            
        col_widths = [30, 130, 95, 90, 80, 110]
        t = Table(table_rows, colWidths=col_widths, repeatRows=1)
        
        t_style = TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ])
        
        for i in range(1, len(table_rows)):
            bg = colors.HexColor('#ffffff') if i % 2 == 1 else colors.HexColor('#f8fafc')
            t_style.add('BACKGROUND', (0, i), (-1, i), bg)
            kat_val = df_sorted.iloc[i-1]['Kategori_Prediksi']
            c_bg = colors.HexColor('#dcfce7')
            if kat_val.lower() == 'tinggi':
                c_bg = colors.HexColor('#fee2e2')
            elif kat_val.lower() == 'sedang':
                c_bg = colors.HexColor('#fef3c7')
            t_style.add('BACKGROUND', (5, i), (5, i), c_bg)
            
        t.setStyle(t_style)
        story.append(t)
        
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='laporan_prediksi_tb_aceh_utara_2026.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
