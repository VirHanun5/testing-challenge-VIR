import buggy from '../../fixtures/buggy.json';
import modelPage from '../../pages/ModelPage';
import { buildUser } from '../../utils/userFactory';

describe('Buggy Cars: votar un modelo con comentario', () => {
  let user;

  beforeEach(() => {
    // Usuario nuevo (cada usuario puede votar una sola vez por modelo) y login por API + cy.session:
    // acá lo que se prueba es el voto, no el login.
    user = buildUser();
    cy.registerUserByApi(user);
    cy.loginByApi(user);
  });

  it('Con la sesión iniciada, vota dejando un comentario y el voto y el comentario se registran', () => {
    const comment = `Comentario QA ${user.username}`;
    // Esperar por requests, no por tiempo: la página pide el modelo (GET /models/<id>) al cargar,
    // después de votar y al recargar. Esa respuesta puede tardar varios segundos (F-02).
    cy.intercept('GET', '**/models/*').as('modelRequest');
    cy.intercept('POST', '**/vote').as('voteRequest');

    modelPage.visit(buggy.model.id);
    cy.wait('@modelRequest');

    modelPage.votesCount().then((votesBefore) => {
      modelPage.vote(comment);
      cy.wait('@voteRequest');
      cy.wait('@modelRequest'); // la app vuelve a pedir el modelo después de votar

      modelPage.thankYouMessage().should('be.visible');
      modelPage.commentRow(comment).should('be.visible');
      // "Mayor que" y no "igual a +1": el sitio es público y otra persona puede votar al mismo tiempo.
      modelPage.votesCount().then((votesAfter) => {
        expect(votesAfter, 'votos después de votar').to.be.greaterThan(votesBefore);
      });
    });

    // Persistencia: al recargar, los datos vienen del servidor, no de la pantalla.
    cy.reload();
    cy.wait('@modelRequest');
    modelPage.commentRow(comment).should('be.visible');
    modelPage.thankYouMessage().should('be.visible'); // el mismo usuario ya no puede volver a votar

    // Se registra en el log qué autor muestra la tabla (candidato a verificar: autores vacíos).
    modelPage
      .commentRow(comment)
      .find('td')
      .eq(1)
      .invoke('text')
      .then((author) => cy.log(`Autor que muestra la tabla: "${author.trim()}"`));
  });
});
