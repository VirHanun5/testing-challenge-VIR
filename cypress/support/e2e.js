// Se carga antes de cada spec.
// Registra el reporter para que adjunte capturas de los tests fallidos al reporte.
import 'cypress-mochawesome-reporter/register';
// Custom commands (cy.createPet, cy.getPet, etc.).
import './commands';
