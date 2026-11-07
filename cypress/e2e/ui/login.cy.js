import loginHeader from '../../pages/LoginHeader';
import { buildUser } from '../../utils/userFactory';

// Técnica ISTQB: partición de equivalencia sobre las credenciales.
// Clases: válidas / contraseña incorrecta / usuario inexistente / campos vacíos.
describe('Buggy Cars: login', () => {
  let user;

  beforeEach(() => {
    user = buildUser();
    // Precondición por API: cada test tiene su propio usuario, así corre solo y en cualquier orden.
    cy.registerUserByApi(user);
    cy.intercept('POST', '**/oauth/token').as('loginRequest');
    cy.visit('/');
  });

  it('Login exitoso con el usuario recién creado: la sesión queda iniciada', () => {
    loginHeader.login(user.username, user.password);
    cy.wait('@loginRequest');

    loginHeader.greeting(user.firstName).should('be.visible');
    loginHeader.logoutLink().should('be.visible');
    // El formulario de login desaparece cuando la sesión está iniciada.
    cy.get('input[name="login"]').should('not.exist');
  });

  context(
    'Login fallido con credenciales inválidas: la app muestra "Invalid username/password"',
    () => {
      it('con contraseña incorrecta', () => {
        loginHeader.login(user.username, 'ContraseñaIncorrecta1!');
        cy.wait('@loginRequest');
        loginHeader.errorMessage().should('be.visible');
      });

      it('con un usuario que no existe', () => {
        loginHeader.login(`noexiste_${Date.now()}`, user.password);
        cy.wait('@loginRequest');
        loginHeader.errorMessage().should('be.visible');
      });
    },
  );

  // Observado al ejecutar (2026-11-06): con campos vacíos la app NO muestra un mensaje propio.
  // Los campos tienen el atributo HTML `required`, así que el NAVEGADOR frena el envío y muestra
  // su globito ("Completa este campo" en español / "Please fill out this field" en inglés).
  // No se compara ese texto porque depende del idioma del navegador (el CI corre en inglés):
  // se valida que el campo esté marcado como obligatorio (validity.valueMissing), que el navegador
  // tenga un mensaje para mostrar (validationMessage no vacío) y que no se envió ningún request.
  context('Login fallido con campos vacíos: el navegador frena el envío', () => {
    it('con usuario y contraseña vacíos', () => {
      loginHeader.login('', '');

      cy.get('input[name="login"]').should(($input) => {
        expect($input[0].validity.valueMissing, 'usuario marcado como obligatorio').to.be.true;
        expect($input[0].validationMessage, 'mensaje que muestra el navegador').to.not.be.empty;
      });
      cy.get('@loginRequest.all').should('have.length', 0);
      cy.get('input[name="login"]').should('be.visible'); // sigue sin sesión
    });

    it('con usuario completo y contraseña vacía', () => {
      loginHeader.login(user.username, '');

      loginHeader
        .form()
        .find('input[name="password"]')
        .should(($input) => {
          expect($input[0].validity.valueMissing, 'contraseña marcada como obligatoria').to.be.true;
          expect($input[0].validationMessage, 'mensaje que muestra el navegador').to.not.be.empty;
        });
      cy.get('@loginRequest.all').should('have.length', 0);
      cy.get('input[name="login"]').should('be.visible'); // sigue sin sesión
    });
  });
});
