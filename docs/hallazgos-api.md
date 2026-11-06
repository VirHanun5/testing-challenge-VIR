# Hallazgos de la API — Swagger Petstore `/pet`

**Qué es un hallazgo acá:** una diferencia entre lo que **promete la documentación oficial** y lo que la API **hace de verdad**. La consigna pide basarse solo en la documentación publicada y, si la API responde distinto, **no forzar el test para que pase** sino documentarlo.

- **Contrato (oráculo):** https://petstore.swagger.io/v2/swagger.json (Swagger 2.0, versión 1.0.7). Visual: https://petstore.swagger.io/
- **API probada:** https://petstore.swagger.io/v2
- **Tests que los cubren:** [`cypress/e2e/api-hallazgos/pet-hallazgos.cy.js`](../cypress/e2e/api-hallazgos/pet-hallazgos.cy.js). Cada test espera lo documentado y **falla** mientras la API no lo cumpla. Se corren con `npm run test:api:hallazgos` y en el CI en el job **api-hallazgos**, que está permitido fallar para no tapar el resultado de los tests estables.
- **Reproducibilidad:** H1 a H6 se observaron **3 de 3 veces** (exploración manual del 2026-11-05 ×2 y suite automatizada del 2026-11-06). La exploración completa está en [exploracion-petstore.md](exploracion-petstore.md).

## Resumen

| Id  | Qué pasa                                          | Documentado | Real                        | Severidad | Prioridad |
| --- | ------------------------------------------------- | ----------- | --------------------------- | --------- | --------- |
| H1  | Id con formato inválido (`/pet/abc`)              | 400         | 404 + error interno de Java | Media     | Media     |
| H2  | Tipos incorrectos en el alta                      | 405         | 500                         | Alta      | Alta      |
| H3  | Alta sin campos obligatorios                      | 405         | 200 (crea la mascota)       | Alta      | Alta      |
| H4  | Alta con `status` fuera de los valores permitidos | 405         | 200 (lo guarda)             | Media     | Media     |
| H5  | Modificar una mascota que no existe               | 404         | 200 (la crea)               | Media     | Media     |
| H6  | `PUT` con id de tipo texto                        | 400         | 500                         | Alta      | Media     |
| H7  | El alta no documenta su respuesta exitosa         | —           | —                           | Baja      | Baja      |

**Criterio:** la **severidad** mide el impacto técnico (datos inválidos guardados o un error del servidor pesan más que un código de error incorrecto), y la **prioridad** la urgencia para quien consume la API (lo que permite guardar datos basura va primero).

---

## H1 — Un id con formato inválido devuelve 404 en lugar de 400 y expone un error interno

**En simple:** si alguien pide una mascota con un id que no es un número (por ejemplo "abc"), la API responde "no encontrada" en lugar de "id inválido", y además muestra un mensaje técnico interno.

| Request           | Documentado               | Real  |
| ----------------- | ------------------------- | ----- |
| `GET /pet/abc`    | `400 Invalid ID supplied` | `404` |
| `DELETE /pet/abc` | `400 Invalid ID supplied` | `404` |

```
GET https://petstore.swagger.io/v2/pet/abc
→ 404 {"code":404,"type":"unknown","message":"java.lang.NumberFormatException: For input string: \"abc\""}
```

**Impacto:** quien integra la API no puede distinguir "el id está mal escrito" de "la mascota no existe". Además, el nombre de la excepción (`java.lang.NumberFormatException`) revela detalles de la implementación.

## H2 — Tipos incorrectos en el alta provocan un error del servidor (500)

**En simple:** si se manda un dato con el tipo equivocado (texto donde va un número, o un texto donde va una lista), la API "se rompe" en lugar de avisar que el dato es inválido.

```
POST https://petstore.swagger.io/v2/pet   {"id":"texto","name":"...","photoUrls":[...]}
→ 500 {"code":500,"type":"unknown","message":"something bad happened"}
```

También pasa con `"photoUrls":"no-array"`. **Documentado:** `405 Invalid input`.

**Impacto:** un 5xx significa "falla del servidor", no "error del cliente". La API no valida los tipos de entrada, y quien la usa no recibe ninguna pista de qué corregir.

## H3 — El alta acepta una mascota sin los campos obligatorios

**En simple:** la documentación dice que toda mascota debe tener nombre y lista de fotos, pero la API deja crear una sin nada de eso.

```
POST https://petstore.swagger.io/v2/pet   {"id":<id único>,"status":"available"}
→ 200 {"id":<id>,"photoUrls":[],"tags":[],"status":"available"}
```

**Documentado:** `name` y `photoUrls` son `required`; un input inválido debería dar `405`.

**Impacto:** quedan guardados datos incompletos (una mascota sin nombre), que después pueden romper a quien los lea.

## H4 — El alta acepta un `status` que no existe

```
POST https://petstore.swagger.io/v2/pet   {..., "status":"volando"}
→ 200 {..., "status":"volando"}
```

**Documentado:** `status` solo admite `available`, `pending` o `sold` (enum).

**Impacto:** una búsqueda por estado (`/pet/findByStatus`) nunca va a encontrar esa mascota; quedan datos fuera del modelo.

## H5 — Modificar una mascota que no existe la crea en lugar de devolver 404

**En simple:** al intentar _editar_ una mascota que no existe, la API la _crea_ sin avisar.

```
GET  https://petstore.swagger.io/v2/pet/<id único>   → 404 (precondición: no existe)
PUT  https://petstore.swagger.io/v2/pet   {"id":<id único>,"name":"...",...}
→ 200 {"id":<id>,...}
GET  https://petstore.swagger.io/v2/pet/<id único>   → 200 (quedó creada)
```

**Documentado:** `404 Pet not found`.

**Impacto:** el `PUT` se comporta como _upsert_ (crear o actualizar). Un error de tipeo en un id crea una mascota nueva en lugar de avisar, y es una operación distinta a la que promete el contrato.

## H6 — `PUT` con id de tipo texto devuelve 500 en lugar de 400

```
PUT https://petstore.swagger.io/v2/pet   {"id":"abc", ...}
→ 500 {"code":500,"type":"unknown","message":"something bad happened"}
```

**Documentado:** `400 Invalid ID supplied`. Misma causa de fondo que H2: no se validan los tipos.

## H7 — La documentación del alta no declara la respuesta exitosa

En el swagger, `POST /pet` documenta **solo** `405 Invalid input`; no declara el `200` ni su schema. En la práctica responde `200` con la mascota creada.

**Decisión tomada:** el test de alta ([`pet-lifecycle.cy.js`](../cypress/e2e/api/pet-lifecycle.cy.js)) valida el `200` observado y el schema `Pet`, y la decisión queda anotada en este documento y en el README.

---

## Casos negativos que SÍ cumplen la documentación

Cubiertos en [`cypress/e2e/api/pet-negative.cy.js`](../cypress/e2e/api/pet-negative.cy.js) (suite estable, debe pasar siempre):

| Caso                         | Request                  | Documentado | Real                              |
| ---------------------------- | ------------------------ | ----------- | --------------------------------- |
| Consultar un id inexistente  | `GET /pet/<id único>`    | 404         | 404 `Pet not found` ✅            |
| Eliminar un id inexistente   | `DELETE /pet/<id único>` | 404         | 404 ✅                            |
| Consultar después de la baja | `GET /pet/<id>`          | 404         | 404 ✅ (en `pet-lifecycle.cy.js`) |
