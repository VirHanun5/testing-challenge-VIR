// Page Object: página de un modelo de auto (https://buggy.justtestit.org/model/<id>),
// donde se vota y se ven los comentarios.
// Selectores: #comment tiene id estable; el botón y los textos se buscan por lo que ve el usuario
// ("Vote!", "Votes:", "Thank you for your vote!"), no por clases de estilo.
class ModelPage {
  visit(modelId) {
    // El id del modelo tiene un "|": se codifica para armar una URL válida.
    cy.visit(`/model/${encodeURIComponent(modelId)}`);
  }

  // Número de votos que muestra la ficha ("Votes: 3947").
  votesCount() {
    return cy
      .contains('h4', 'Votes:')
      .find('strong')
      .invoke('text')
      .then((text) => Number(text.trim()));
  }

  vote(comment) {
    cy.get('#comment').type(comment);
    cy.contains('button', 'Vote!').click();
  }

  thankYouMessage() {
    return cy.contains('Thank you for your vote!');
  }

  // Fila de la tabla de comentarios que contiene el texto dado.
  commentRow(text) {
    return cy.contains('table tbody tr', text);
  }
}

export default new ModelPage();
