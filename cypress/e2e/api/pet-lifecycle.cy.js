import petSchema from '../../schemas/pet.schema.json';
import apiResponseSchema from '../../schemas/api-response.schema.json';
import { buildPet } from '../../utils/petFactory';
import { validateSchema } from '../../utils/schemaValidator';

// Técnica ISTQB: transición de estados.
// Estados de una mascota: (no existe) → available → sold → (eliminada: 404).
// Cada test arma sus propios datos, así puede correr solo y en cualquier orden.
describe('API Petstore /pet: ciclo de vida de una mascota', () => {
  let pet;

  beforeEach(() => {
    pet = buildPet();
  });

  // Limpieza: afterEach corre aunque el test haya fallado.
  // Si la mascota ya no existe (por ejemplo, después de la baja), el DELETE da 404 y no afecta.
  afterEach(() => {
    cy.deletePet(pet.id);
  });

  it('Alta: crea una mascota con datos generados dinámicamente', () => {
    cy.createPet(pet).then((res) => {
      // La documentación no declara la respuesta exitosa del alta (hallazgo H7); se valida el 200 observado.
      expect(res.status).to.eq(200);
      validateSchema(petSchema, res.body);
      expect(res.body).to.deep.equal(pet);
    });
  });

  context('con una mascota ya creada', () => {
    beforeEach(() => {
      cy.createPet(pet);
    });

    it('Consulta: la obtiene por id y los datos coinciden con los enviados', () => {
      cy.getPet(pet.id).then((res) => {
        expect(res.status).to.eq(200);
        validateSchema(petSchema, res.body);
        expect(res.body).to.deep.equal(pet);
      });
    });

    it('Modificación: cambia el status de available a sold y el cambio persiste', () => {
      const soldPet = { ...pet, status: 'sold' };

      cy.updatePet(soldPet).then((res) => {
        expect(res.status).to.eq(200);
        validateSchema(petSchema, res.body);
        expect(res.body).to.deep.equal(soldPet);
      });

      // Se vuelve a consultar para comprobar que el cambio quedó guardado, no solo que el PUT respondió bien.
      cy.getPet(pet.id).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.status).to.eq('sold');
      });
    });

    it('Baja: la elimina y la consulta posterior devuelve 404', () => {
      cy.deletePet(pet.id).then((res) => {
        expect(res.status).to.eq(200);
        validateSchema(apiResponseSchema, res.body);
        expect(res.body.message).to.eq(String(pet.id));
      });

      cy.getPet(pet.id).then((res) => {
        expect(res.status).to.eq(404);
        validateSchema(apiResponseSchema, res.body);
        expect(res.body.message).to.eq('Pet not found');
      });
    });
  });
});
