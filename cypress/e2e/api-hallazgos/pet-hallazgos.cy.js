import { buildPet } from '../../utils/petFactory';

// HALLAZGOS: estos tests esperan lo que dice la DOCUMENTACIÓN de Petstore
// (https://petstore.swagger.io/v2/swagger.json). Hoy FALLAN porque la API responde distinto.
// No se fuerzan para que pasen, como pide la consigna: cada diferencia está documentada en
// docs/hallazgos-api.md con su id (H1, H2...). Si un día la API se corrige, estos tests pasan solos.
//
// Técnica ISTQB: partición de equivalencia. Cada test es un representante de una clase inválida.
const petUrl = () => `${Cypress.expose('apiUrl')}/pet`;

// Request "crudo": sin fallar automáticamente por el status, para poder comparar con la documentación.
const send = (method, url, body) => cy.request({ method, url, body, failOnStatusCode: false });

// Compara el status con el documentado. Si no coincide, el mensaje muestra la respuesta REAL,
// así el reporte queda como evidencia del hallazgo. Se usa expect (falla al instante) y no
// .should() (reintenta 4 s), porque la respuesta ya llegó y no va a cambiar.
const expectDocumentedStatus = (expected) => (res) => {
  expect(res.status, `Respuesta real: ${res.status} ${JSON.stringify(res.body)}`).to.eq(expected);
};

describe('API Petstore /pet: hallazgos (la API no cumple su documentación)', () => {
  let pet;

  beforeEach(() => {
    pet = buildPet();
  });

  // Algunos de estos casos CREAN una mascota aunque no deberían (H3, H4, H5): se limpia igual.
  afterEach(() => {
    cy.deletePet(pet.id);
  });

  context('Clase: id con formato inválido', () => {
    it('[H1] GET /pet/abc debería devolver 400 "Invalid ID supplied"', () => {
      send('GET', `${petUrl()}/abc`).then(expectDocumentedStatus(400));
    });

    it('[H1] DELETE /pet/abc debería devolver 400 "Invalid ID supplied"', () => {
      send('DELETE', `${petUrl()}/abc`).then(expectDocumentedStatus(400));
    });

    it('[H6] PUT /pet con id de texto debería devolver 400 "Invalid ID supplied"', () => {
      send('PUT', petUrl(), { ...pet, id: 'abc' }).then(expectDocumentedStatus(400));
    });
  });

  context('Clase: payload inválido en el alta', () => {
    it('[H2] POST /pet con id de tipo texto debería devolver 405 "Invalid input"', () => {
      send('POST', petUrl(), { ...pet, id: 'texto' }).then(expectDocumentedStatus(405));
    });

    it('[H3] POST /pet sin los campos requeridos (name, photoUrls) debería devolver 405', () => {
      send('POST', petUrl(), { id: pet.id, status: 'available' }).then(expectDocumentedStatus(405));
    });

    it('[H4] POST /pet con status fuera del enum debería devolver 405', () => {
      send('POST', petUrl(), { ...pet, status: 'volando' }).then(expectDocumentedStatus(405));
    });
  });

  context('Clase: modificar una mascota que no existe', () => {
    it('[H5] PUT /pet con un id inexistente debería devolver 404 "Pet not found"', () => {
      // Precondición: la mascota NO existe todavía (si existiera, el 200 sería correcto).
      cy.getPet(pet.id).its('status').should('eq', 404);
      send('PUT', petUrl(), pet).then(expectDocumentedStatus(404));
    });
  });
});
