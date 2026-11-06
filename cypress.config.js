const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Reporte HTML con capturas de los tests fallidos incrustadas.
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'Challenge SDET',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },

  // Valores públicos (no secretos). Se leen con Cypress.expose('apiUrl').
  // Se pueden pisar sin tocar código: npx cypress run --expose apiUrl=https://otra-url
  expose: {
    apiUrl: 'https://petstore.swagger.io/v2',
    // API que usa por detrás el sitio Buggy Cars (se vio en DevTools → Network).
    buggyApiUrl: 'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod',
  },

  e2e: {
    baseUrl: 'https://buggy.justtestit.org',
    specPattern: 'cypress/e2e/**/*.cy.js',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
});
