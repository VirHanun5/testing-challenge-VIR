import { faker } from '@faker-js/faker';

/**
 * Id único para no chocar con otros usuarios de Petstore (entorno público y compartido).
 * Date.now() da los milisegundos actuales; × 1000 + un aleatorio de 0 a 999 evita que
 * dos ids creados en el mismo milisegundo coincidan. El resultado (~1.8 × 10^15) entra
 * en el int64 que pide la documentación y en los enteros seguros de JavaScript.
 */
export function uniqueId() {
  return Date.now() * 1000 + faker.number.int({ min: 0, max: 999 });
}

/**
 * Arma una mascota válida según el contrato, con datos distintos en cada ejecución.
 * `overrides` permite cambiar campos puntuales: buildPet({ status: 'sold' }).
 */
export function buildPet(overrides = {}) {
  return {
    id: uniqueId(),
    category: { id: faker.number.int({ min: 1, max: 100 }), name: faker.animal.type() },
    name: `${faker.animal.petName()}-qa`,
    photoUrls: [faker.image.url()],
    tags: [{ id: faker.number.int({ min: 1, max: 100 }), name: 'challenge-sdet' }],
    status: 'available',
    ...overrides,
  };
}
