// Page Object (de un componente): el login del header, que aparece en todas las páginas.
// Selectores: input[name="login"] es único en el sitio; el formulario se ubica a partir de él
// (en vez de usar la clase de estilo .form-inline) y la contraseña se busca DENTRO de ese formulario.
class LoginHeader {
  form() {
    return cy.get('input[name="login"]').closest('form');
  }

  // Los campos vacíos se dejan sin escribir: así se prueba el caso "campos vacíos" del PDF.
  login(username, password) {
    if (username) this.form().find('input[name="login"]').type(username);
    if (password) this.form().find('input[name="password"]').type(password, { log: false });
    this.form().contains('button', 'Login').click();
  }

  // Con la sesión iniciada el header muestra "Hi, <nombre>" y el link Logout.
  greeting(firstName) {
    return cy.contains(`Hi, ${firstName}`);
  }

  logoutLink() {
    return cy.contains('a', 'Logout');
  }

  logout() {
    this.logoutLink().click();
  }

  errorMessage() {
    return cy.contains('Invalid username/password');
  }
}

export default new LoginHeader();
