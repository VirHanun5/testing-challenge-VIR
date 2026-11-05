# Exploración manual — Swagger Petstore `/pet`

- **Fecha:** 2026-11-05
- **API:** https://petstore.swagger.io/v2 (especificación Swagger 2.0, versión 1.0.7)
- **Contrato usado:** https://petstore.swagger.io/v2/swagger.json (Swagger UI: https://petstore.swagger.io/)
- **Método:** requests reales con ids únicos (`Date.now() * 1000 + aleatorio`). Cada diferencia con la documentación se reprodujo **2 veces** antes de registrarla. Todas las mascotas creadas se borraron al terminar.

## 1. Qué promete la documentación (el contrato)

| Operación    | Endpoint              | Respuestas documentadas                                                    |
| ------------ | --------------------- | -------------------------------------------------------------------------- |
| Alta         | `POST /pet`           | **solo** `405 Invalid input` (no documenta la respuesta exitosa)           |
| Consulta     | `GET /pet/{petId}`    | `200` (con schema Pet), `400 Invalid ID supplied`, `404 Pet not found`     |
| Modificación | `PUT /pet`            | `400 Invalid ID supplied`, `404 Pet not found`, `405 Validation exception` |
| Baja         | `DELETE /pet/{petId}` | `400 Invalid ID supplied`, `404 Pet not found`                             |

Modelo **Pet**: `id` (integer int64), `category` {id, name}, `name` (string), `photoUrls` (array de string), `tags` [{id, name}], `status` (enum: `available`, `pending`, `sold`). **Requeridos:** `name` y `photoUrls`.

## 2. Ciclo de vida (camino feliz) — funciona según lo esperado (3 de 3 corridas)

| Paso               | Request                       | Status  | Observación                                                 |
| ------------------ | ----------------------------- | ------- | ----------------------------------------------------------- |
| Alta               | `POST /pet`                   | 200     | Devuelve la mascota tal como se envió                       |
| Consulta           | `GET /pet/{id}`               | 200     | Los datos coinciden con los enviados                        |
| Modificación       | `PUT /pet` con `status: sold` | 200     | Devuelve la mascota con `sold`                              |
| Consulta           | `GET /pet/{id}`               | 200     | `status` = `sold`                                           |
| Baja               | `DELETE /pet/{id}`            | 200     | Body: `{"code":200,"type":"unknown","message":"<id>"}`      |
| Consulta posterior | `GET /pet/{id}`               | **404** | Body: `{"code":1,"type":"error","message":"Pet not found"}` |

Tiempos de respuesta observados: entre 160 y 200 ms por request.

## 3. Casos negativos

| #   | Caso (partición de equivalencia)                   | Request                                       | Esperado (doc)  | Obtenido                                              | ¿Coincide?                       |
| --- | -------------------------------------------------- | --------------------------------------------- | --------------- | ----------------------------------------------------- | -------------------------------- |
| N1  | Id válido pero inexistente                         | `GET /pet/<id único>`                         | 404             | 404 `Pet not found`                                   | ✅                               |
| N2  | Borrar un id inexistente                           | `DELETE /pet/<id único>`                      | 404             | 404 (body vacío)                                      | ✅                               |
| N3  | Id con formato inválido (texto)                    | `GET /pet/abc`                                | 400             | **404** + `java.lang.NumberFormatException`           | ❌ H1                            |
| N4  | Id con formato inválido (decimal)                  | `GET /pet/1.5`                                | 400             | **404** + `NumberFormatException`                     | ❌ H1                            |
| N5  | Borrar con id inválido                             | `DELETE /pet/abc`                             | 400             | **404** + `NumberFormatException`                     | ❌ H1                            |
| N6  | Id negativo                                        | `GET /pet/-1`                                 | no especificado | 404 `Pet not found`                                   | —                                |
| N7  | `id` de tipo incorrecto (texto)                    | `POST /pet` `{"id":"texto",...}`              | 405             | **500** `something bad happened`                      | ❌ H2                            |
| N8  | `photoUrls` no es array                            | `POST /pet` `{"photoUrls":"no-array",...}`    | 405             | **500** `something bad happened`                      | ❌ H2                            |
| N9  | Faltan los campos requeridos (`name`, `photoUrls`) | `POST /pet` `{"id":...,"status":"available"}` | 405             | **200**: crea la mascota sin nombre                   | ❌ H3                            |
| N10 | `status` fuera del enum                            | `POST /pet` `{"status":"volando",...}`        | 405             | **200**: guarda `"volando"`                           | ❌ H4                            |
| N11 | Modificar una mascota inexistente                  | `PUT /pet` con id único                       | 404             | **200**: la **crea** (un `GET` posterior la devuelve) | ❌ H5                            |
| N12 | `PUT` con id de tipo incorrecto                    | `PUT /pet` `{"id":"abc",...}`                 | 400             | **500** `something bad happened`                      | ❌ H6                            |
| N13 | JSON mal formado                                   | `POST /pet` `{"name": "x", `                  | 405             | 400 `bad input`                                       | ⚠️ visto 1 vez, falta reproducir |
| N14 | `name` de tipo número                              | `POST /pet` `{"name":12345,...}`              | 405             | 200: lo convierte a `"12345"`                         | ⚠️ visto 1 vez, falta reproducir |

## 4. Hallazgos (diferencias con la documentación, reproducidas 2 de 2 veces)

- **H1 — Id con formato inválido devuelve 404 en lugar de 400 y expone un error interno.** `GET /pet/abc`, `GET /pet/1.5` y `DELETE /pet/abc` responden 404 con `java.lang.NumberFormatException: For input string: "abc"`. La documentación dice `400 Invalid ID supplied`. Además, mostrar el nombre de la excepción revela detalles internos de la implementación (Java).
- **H2 — Tipos incorrectos en el alta devuelven 500 en lugar de 405.** Si `id` es texto o `photoUrls` no es un array, el servidor responde `500 something bad happened`. Un 500 indica un error **del servidor**; la documentación promete `405 Invalid input`.
- **H3 — El alta acepta una mascota sin los campos requeridos.** Sin `name` ni `photoUrls` responde 200 y crea la mascota. La documentación marca ambos campos como `required`.
- **H4 — El alta acepta un `status` fuera de los valores permitidos.** Guarda `"volando"`, que no está en el enum `available | pending | sold`.
- **H5 — `PUT` sobre una mascota inexistente la crea en lugar de devolver 404.** El `PUT` se comporta como "crear o actualizar" (_upsert_). La documentación promete `404 Pet not found`.
- **H6 — `PUT` con id de tipo incorrecto devuelve 500 en lugar de 400.**
- **H7 — Documentación incompleta del alta.** `POST /pet` no documenta su respuesta exitosa (200) ni su schema; solo documenta el 405.

## 5. Qué implica para la automatización (a decidir el Día 3)

- El ciclo de vida se puede automatizar tal cual: el comportamiento es estable.
- Los hallazgos **no se fuerzan**: el test debe esperar lo que dice la documentación. Si la API no lo cumple, el test falla y el hallazgo queda documentado (lo pide el PDF).
- Limpieza: hay que contemplar que `PUT` y `POST` con datos inválidos **pueden crear mascotas** (H3, H4, H5), así que también hay que borrarlas.
