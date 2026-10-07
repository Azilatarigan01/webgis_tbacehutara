describe('WebGIS TB Aceh Utara Interactive Showcase & Demo', () => {
  it('demonstrates overview, moran, lisa clusters, prophet forecasting, and theme switching', () => {
    // 1. Overview Dashboard
    cy.visit('http://127.0.0.1:5000');
    cy.wait(3000);
    cy.screenshot('01_dashboard_utama');

    // 2. Global Moran Analysis Tab
    cy.get('.nav-link[data-tab="moran"]').click();
    cy.wait(2500);
    cy.screenshot('02_analisis_global_moran');

    // 3. LISA Spatial Clustering Tab
    cy.get('.nav-link[data-tab="lisa"]').click();
    cy.wait(2500);
    cy.screenshot('03_kluster_lisa_spasial');

    // 4. Prophet Forecasting 2026 Tab
    cy.get('.nav-link[data-tab="prophet"]').click();
    cy.wait(3000);
    cy.screenshot('04_prediksi_prophet_2026');

    // 5. Back to Dashboard
    cy.get('.nav-link[data-tab="overview"]').click();
    cy.wait(2000);
  });
});
