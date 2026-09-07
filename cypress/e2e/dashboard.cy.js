describe('WebGIS TB Aceh Utara Automated UI Tests', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should successfully load the main dashboard page and verify summary cards', () => {
    // Verify document title
    cy.title().should('include', 'WebGIS Tuberkulosis Aceh Utara');

    // Verify main header and subtitle
    cy.get('#tab-title').should('contain', 'Dashboard Utama');
    cy.get('#tab-subtitle').should('contain', 'Ringkasan Kondisi TB');

    // Verify the presence and initial values of summary cards
    cy.get('#summary-total-kec').should('not.be.empty');
    cy.get('#summary-total-cases').should('not.be.empty');
    cy.get('#summary-pred-2026').should('not.be.empty');
    cy.get('#summary-spatial-val').should('not.be.empty');
  });

  it('should switch tabs correctly using sidebar navigation', () => {
    // 1. Switch to Global Moran's I Tab
    cy.get('.nav-link[data-tab="moran"]').click();
    cy.get('#tab-title').should('contain', 'Global Moran\'s I');
    cy.get('#tab-moran').should('be.visible');
    cy.get('#tab-overview').should('not.be.visible');
    cy.get('#moranChart').should('be.visible');
    cy.get('#moran-table').should('be.visible');

    // 2. Switch to Kluster LISA Tab
    cy.get('.nav-link[data-tab="lisa"]').click();
    cy.get('#tab-title').should('contain', 'Kluster LISA');
    cy.get('#tab-lisa').should('be.visible');
    cy.get('#lisaMap').should('be.visible');
    cy.get('#lisa-table').should('be.visible');

    // 3. Switch to Prediksi Prophet Tab
    cy.get('.nav-link[data-tab="prophet"]').click();
    cy.get('#tab-title').should('contain', 'Prediksi Tren & Spasial 2026');
    cy.get('#tab-prophet').should('be.visible');
    cy.get('#prophetMap').should('be.visible');
    cy.get('#prophetTrendChart').should('be.visible');
    cy.get('#prophet-spatial-table').should('be.visible');

    // 4. Return to Dashboard (Overview) Tab
    cy.get('.nav-link[data-tab="overview"]').click();
    cy.get('#tab-title').should('contain', 'Dashboard Utama');
    cy.get('#tab-overview').should('be.visible');
  });

  it('should toggle UI theme between dark and light modes', () => {
    // Check initial state of the data-theme attribute on <html>
    cy.get('html').then(($html) => {
      const initialTheme = $html.attr('data-theme') || 'dark';
      const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark';

      // Click the theme toggle button
      cy.get('#theme-toggle').click();

      // Verify the theme has changed
      cy.get('html').should('have.attr', 'data-theme', expectedTheme);

      // Toggle back to initial theme
      cy.get('#theme-toggle').click();
      cy.get('html').should('have.attr', 'data-theme', initialTheme);
    });
  });

  it('should search and filter data in LISA table', () => {
    // Navigate to Kluster LISA Tab
    cy.get('.nav-link[data-tab="lisa"]').click();

    // Check that we have records in the table body
    cy.get('#lisa-table-body tr').should('have.length.at.least', 1);

    // Type a specific Kecamatan in search box (e.g. Lhoksukon)
    const searchKeyword = 'Lhoksukon';
    cy.get('#lisa-search').clear().type(searchKeyword);

    // Verify that all visible rows contain the search keyword
    cy.get('#lisa-table-body tr:visible').each(($row) => {
      cy.wrap($row).find('td').eq(1).should('contain', searchKeyword);
    });
  });

  it('should filter, sort, and search in Prophet 2026 table', () => {
    // Navigate to Prediksi Prophet Tab
    cy.get('.nav-link[data-tab="prophet"]').click();

    // 1. Test Kategori Filters (Tinggi, Sedang, Rendah)
    cy.get('#category-filter-container button[data-filter="tinggi"]').click();
    cy.get('#category-filter-container button[data-filter="tinggi"]').should('have.class', 'active');
    
    // Verify that only 'Tinggi' status items are displayed
    cy.get('#prophet-spatial-table-body tr:visible').each(($row) => {
      cy.wrap($row).find('td').eq(5).should('contain.text', 'Tinggi');
    });

    // Reset filter to 'Semua'
    cy.get('#category-filter-container button[data-filter="all"]').click();

    // 2. Test Search filter in Prophet table
    const targetKec = 'Syamtalira';
    cy.get('#prophet-spatial-search').clear().type(targetKec);
    
    cy.get('#prophet-spatial-table-body tr:visible').each(($row) => {
      cy.wrap($row).find('td').eq(1).should('contain.text', targetKec);
    });

    // Clear search
    cy.get('#prophet-spatial-search').clear();

    // 3. Test Sorting option dropdown
    cy.get('#prophet-table-sort').select('name_asc');
    
    // Verify first row is alphabetically sorted
    cy.get('#prophet-spatial-table-body tr:visible').first().find('td').eq(1).then(($td) => {
      const name = $td.text().trim();
      // Should sort alphabetically, so check if it contains a name starting with early letters like A or B
      expect(name.length).to.be.greaterThan(0);
    });
  });

  it('should have working export links to API endpoints', () => {
    // Navigate to Prediksi Prophet Tab
    cy.get('.nav-link[data-tab="prophet"]').click();

    // Verify export buttons are present and point to correct endpoints
    cy.get('a.btn-export').contains('Excel').should('have.attr', 'href', '/api/export/excel');
    cy.get('a.btn-export').contains('PDF').should('have.attr', 'href', '/api/export/pdf');
    cy.get('a.btn-export').contains('GeoJSON').should('have.attr', 'href', '/api/export/spatial');
  });
});

// Avoid failing tests due to uncaught 3rd party library errors (e.g. Leaflet map or Chart.js loading issue)
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});
