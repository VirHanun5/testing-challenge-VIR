import loginHeader from '../../pages/LoginHeader';
import { buildUser } from '../../utils/userFactory';

describe('Buggy Cars: logout', () => {
  let user;

  beforeEach(() => {
    user = buildUser();
    cy.registerUserByApi(user);
    cy.loginByApi(user); // login por API + cy.session: acá se prueba el logout
  });

  it('Cierra la sesión y vuelve a mostrar el formulario de login', () => {
    cy.visit('/');
    loginHeader.greeting(user.firstName).should('be.visible'); // precondición: sesión iniciada

    loginHeader.logout();

    cy.get('input[name="login"]').should('be.visible');
    loginHeader.logoutLink().should('not.exist');
    // La app borra el token de localStorage al cerrar sesión.
    cy.window().its('localStorage.token').should('not.exist');

    // Al recargar sigue sin sesión (no quedó nada guardado).
    cy.reload();
    cy.get('input[name="login"]').should('be.visible');
  });
});
