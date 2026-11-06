import { faker } from '@faker-js/faker';

/**
 * Usuario nuevo en cada ejecución (el PDF pide no usar usuarios creados a mano).
 * - username: prefijo "qa_" + aleatorio + timestamp → único y fácil de reconocer como dato de prueba.
 *   Queda muy por debajo del máximo de 50 caracteres que valida el formulario.
 * - password: el servidor exige mínimo 6 caracteres (hallazgo C9) y no documenta otras reglas.
 *   Por las dudas se agregan mayúscula, minúscula, número y símbolo para cubrir políticas típicas.
 */
export function buildUser() {
  return {
    username: `qa_${faker.string.alphanumeric({ length: 6, casing: 'lower' })}_${Date.now()}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: `${faker.internet.password({ length: 10 })}aA1!`,
  };
}
