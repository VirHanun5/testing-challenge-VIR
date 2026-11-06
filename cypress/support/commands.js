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

// ---------- Buggy Cars ----------
// Crea un usuario por API (POST /users, el mismo request que hace el formulario de registro).
// Se usa como PRECONDICIÓN en los tests donde el registro no es lo que se prueba: es más rápido
// y no depende de la UI de registro (el PDF lo permite: "podés hacerlo por API").
Cypress.Commands.add('registerUserByApi', (user) =>
  cy.request('POST', `${Cypress.expose('buggyApiUrl')}/users`, {
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    password: user.password,
    confirmPassword: user.password,
  }),
);

Cypress.Commands.add('deletePet', (id) =>
  cy.request({ method: 'DELETE', url: `${petUrl()}/${id}`, failOnStatusCode: false }),
);
