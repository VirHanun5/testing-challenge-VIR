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

// Login por API + cy.session.
// - Por API: pide el token a POST /oauth/token (lo mismo que hace el formulario) y lo guarda en
//   localStorage["token"], que es donde la app lo busca al cargar. Se usa cuando el login NO es lo
//   que se está probando (el login por UI ya tiene su propio test en login.cy.js).
// - cy.session: guarda la sesión con el nombre del usuario. Si el mismo usuario vuelve a loguearse
//   (en otro test o en un reintento), Cypress la RESTAURA en vez de repetir el login.
// - validate: después de restaurarla, comprueba que siga siendo válida (el header muestra Logout).
Cypress.Commands.add('loginByApi', (user) => {
  cy.session(
    user.username,
    () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.expose('buggyApiUrl')}/oauth/token`,
        form: true, // la app manda los datos como formulario (application/x-www-form-urlencoded)
        body: { grant_type: 'password', username: user.username, password: user.password },
        log: false,
      }).then((res) => {
        cy.visit('/');
        cy.window().then((win) => win.localStorage.setItem('token', res.body.access_token));
      });
    },
    {
      validate() {
        cy.visit('/');
        cy.contains('a', 'Logout').should('be.visible');
      },
    },
  );
});

Cypress.Commands.add('deletePet', (id) =>
  cy.request({ method: 'DELETE', url: `${petUrl()}/${id}`, failOnStatusCode: false }),
);
