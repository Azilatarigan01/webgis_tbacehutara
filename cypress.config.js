const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "jnrsts",
  video: true,
  e2e: {
    baseUrl: "http://127.0.0.1:5000",
    viewportWidth: 1440,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: "cypress/support/e2e.js"
  },
});
