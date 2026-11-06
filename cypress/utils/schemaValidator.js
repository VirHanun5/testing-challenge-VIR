import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// allErrors: informa todos los errores juntos, no solo el primero.
const ajv = new Ajv({ allErrors: true });
// Agrega formatos como "int64" e "int32", que usa la documentación de Petstore.
addFormats(ajv);

/**
 * Valida que `data` cumpla el JSON Schema. Si no cumple, el test falla
 * mostrando qué campo no respetó el contrato (por ejemplo "data/id must be integer").
 */
export function validateSchema(schema, data) {
  const validate = ajv.compile(schema);
  const isValid = validate(data);
  expect(isValid, `Contrato "${schema.title}": ${ajv.errorsText(validate.errors)}`).to.be.true;
}
