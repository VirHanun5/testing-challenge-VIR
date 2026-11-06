// Page Object: página de registro (https://buggy.justtestit.org/register).
// Selectores: los campos tienen `id` estables (no dependen del estilo). El sitio no tiene data-test.
// Se usa #password y no [name="password"] porque en esta página hay DOS campos con ese name
// (el del login del header y el del formulario).
class RegisterPage {
  visit() {
    cy.visit('/register');
  }

  fillForm(user) {
    cy.get('#username').type(user.username);
    cy.get('#firstName').type(user.firstName);
    cy.get('#lastName').type(user.lastName);
    cy.get('#password').type(user.password, { log: false });
    cy.get('#confirmPassword').type(user.password, { log: false });
  }

  submit() {
    // El botón del formulario (en el header "Register" es un link, no un botón).
    cy.contains('button', 'Register').click();
  }

  register(user) {
    this.fillForm(user);
    this.submit();
  }

  // Mensaje que muestra la app al registrarse bien.
  successMessage() {
    return cy.contains('Registration is successful');
  }
}

export default new RegisterPage();
