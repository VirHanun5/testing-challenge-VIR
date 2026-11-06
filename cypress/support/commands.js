// Custom commands reutilizables para la API de Petstore.
// La URL base sale de cypress.config.js (expose.apiUrl), no del código de los tests.
const petUrl = () => `${Cypress.expose('apiUrl')}/pet`;

// Alta: POST /pet
Cypress.Commands.add('createPet', (pet) => cy.request('POST', petUrl(), pet));

// Modificación: PUT /pet
Cypress.Commands.add('updatePet', (pet) => cy.request('PUT', petUrl(), pet));

// Consulta y baja: failOnStatusCode: false para poder validar también los 404.
// (Por defecto cy.request falla el test ante cualquier status que no sea 2xx o 3xx).
Cypress.Commands.add('getPet', (id) =>
  cy.request({ method: 'GET', url: `${petUrl()}/${id}`, failOnStatusCode: false }),
);

Cypress.Commands.add('deletePet', (id) =>
  cy.request({ method: 'DELETE', url: `${petUrl()}/${id}`, failOnStatusCode: false }),
);
