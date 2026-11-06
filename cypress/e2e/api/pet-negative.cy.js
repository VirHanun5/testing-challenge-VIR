import apiResponseSchema from '../../schemas/api-response.schema.json';
import { uniqueId } from '../../utils/petFactory';
import { validateSchema } from '../../utils/schemaValidator';

// Casos negativos en los que la API SÍ cumple su documentación.
// Técnica ISTQB: partición de equivalencia. Clase: "id con formato válido que no existe".
// (Los casos en los que la API NO cumple la documentación están en cypress/e2e/api-hallazgos/).
describe('API Petstore /pet: casos negativos', () => {
  it('Consultar un id inexistente devuelve 404 "Pet not found"', () => {
    cy.getPet(uniqueId()).then((res) => {
      expect(res.status).to.eq(404);
      validateSchema(apiResponseSchema, res.body);
      expect(res.body.message).to.eq('Pet not found');
    });
  });

  it('Eliminar un id inexistente devuelve 404', () => {
    cy.deletePet(uniqueId()).then((res) => {
      expect(res.status).to.eq(404);
    });
  });
});
