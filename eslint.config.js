const js = require('@eslint/js');
const globals = require('globals');
const pluginCypress = require('eslint-plugin-cypress');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/',
      'cypress/reports/',
      'cypress/screenshots/',
      'cypress/videos/',
      'cypress/downloads/',
    ],
  },

  // Reglas base de JavaScript (variables sin usar, typos, etc.).
  js.configs.recommended,

  // Archivos de configuración en la raíz: corren en Node con require().
  {
    files: ['*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },

  // Tests y helpers de Cypress: usan import/export.
  // "recommended" incluye cypress/no-unnecessary-waiting en error (prohíbe cy.wait(5000)).
  {
    ...pluginCypress.configs.recommended,
    files: ['cypress/**/*.js'],
  },
  {
    files: ['cypress/**/*.js'],
    languageOptions: { sourceType: 'module' },
  },

  // Va último: apaga las reglas de formato de ESLint para que no choquen con Prettier.
  prettierConfig,
];
