import registerPage from '../../pages/RegisterPage';
import { buildUser } from '../../utils/userFactory';

describe('Buggy Cars: registro de usuario', () => {
  it('Un usuario nuevo (generado en cada ejecución) se registra con éxito', () => {
    const user = buildUser();
    // Esperar por el request y no por tiempo: se avisa cuando la app llama a POST /users.
    cy.intercept('POST', '**/users').as('registerRequest');

    registerPage.visit();
    registerPage.register(user);

    cy.wait('@registerRequest');
    registerPage.successMessage().should('be.visible');
  });
});
