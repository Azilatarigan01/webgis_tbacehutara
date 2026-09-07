const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "jnrsts",
  e2e: {
    baseUrl: "http://127.0.0.1:5000",
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: "cypress/support/e2e.js"
  },
});
