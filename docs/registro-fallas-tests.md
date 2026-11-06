# Registro de fallas de tests

Acá quedan los tests que **fallaron por un problema del propio test** (no de la aplicación), cómo se investigó cada falla y cómo se corrigió. Sirve para distinguir un **defecto del sistema** de un **error en la prueba**, y para no repetir el mismo error.

> **Falso positivo** (ISTQB): el test reporta un defecto que no existe; el problema está en el test.
> **Falso negativo:** el test pasa aunque el defecto existe.

---

## F-01 — Login con campos vacíos: el test esperaba un mensaje que la app no muestra

| Campo             | Valor                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Fecha**         | 2026-11-06                                                                                                                     |
| **Test**          | `Buggy Cars: login › Login fallido... › con los campos vacíos` ([`cypress/e2e/ui/login.cy.js`](../cypress/e2e/ui/login.cy.js)) |
| **Sitio**         | https://buggy.justtestit.org/ (login del header)                                                                               |
| **Entorno**       | Cypress 16.2.1, navegador Electron (el de `cypress run`), Windows 11, en la PC de Virginia                                     |
| **Clasificación** | **Falso positivo**: el test falló sin que la aplicación tenga un defecto                                                       |
| **Causa**         | La expectativa del test se escribió **sin haberla observado antes**                                                            |
| **Estado**        | ✅ Corregido: la suite de UI pasa 6 de 6 (ejecutada por Virginia)                                                              |

### 1. Qué esperaba el test (versión original)

Que, al hacer click en **Login** con usuario y contraseña vacíos, la app mostrara el aviso **"Invalid username/password"**, el mismo que aparece con credenciales incorrectas.

Esa expectativa era una **suposición**: el mensaje se había observado con una contraseña incorrecta y con un usuario inexistente, pero **nunca con los campos vacíos**. El caso estaba marcado como "no confirmado" antes de correrlo.

### 2. Qué pasó al ejecutarlo

Virginia corrió `npm run test:ui`: **4 de 5 OK y 1 falla**, la de campos vacíos.

```
×  login.cy.js      4 tests   3 passing   1 failing
√  register.cy.js   1 test    1 passing
```

Error de Cypress:

```
expected Invalid username/password to be visible
```

### 3. Qué se observó en la evidencia

En la **captura automática** que Cypress guarda de cada test fallido (`cypress/screenshots/login.cy.js/...(failed).png`) se veía:

- Debajo del campo **Login** del header, el **globito del navegador** con el texto **"Completa este campo"**.
- **Ningún aviso de la app** ("Invalid username/password" no aparecía).
- En el log de Cypress, después del `click` **no había ningún request** `POST /oauth/token`: el formulario **no se llegó a enviar**.

(La captura automática de esa falla no se conservó: se borró al limpiar las salidas antes de volver a correr. El mismo comportamiento se ve en la captura de la sección 6).

### 4. Por qué pasa (análisis)

Los dos campos del login tienen el atributo HTML **`required`** (visto en el template de la app: `<input ngModel name="login" required ...>`). Con ese atributo, **el navegador mismo** bloquea el envío del formulario si el campo está vacío y muestra su mensaje nativo. La app nunca recibe el intento, así que **nunca puede mostrar** "Invalid username/password".

**Conclusión:** la aplicación se comporta de una forma válida (validación nativa del navegador). El que estaba mal era el **test**.

### 5. Cómo se corrigió

| Antes                                         | Después                                                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Esperaba el texto "Invalid username/password" | Verifica que el navegador marque el campo como **obligatorio sin completar** (`validity.valueMissing === true`) |
| —                                             | Verifica que **no se envió** ningún request de login (`cy.get('@loginRequest.all')` con largo 0)                |
| —                                             | Verifica que la sesión **sigue sin iniciarse** (el formulario de login sigue visible)                           |
| 1 caso (ambos vacíos)                         | 2 casos: **ambos vacíos** y **usuario completo con contraseña vacía** (partición de equivalencia)               |

**Por qué NO se valida el texto "Completa este campo":** ese texto lo pone el **navegador según su idioma**. En la PC de Virginia está en español, pero el runner de GitHub Actions está en inglés ("Please fill out this field"). Validar el texto haría que el test pase en una PC y falle en el CI. `validity.valueMissing` es igual en cualquier idioma.

### 6. Resultado

Virginia volvió a correr `npm run test:ui`: **6 de 6 OK**. También lo verificó en el modo visual (`npx cypress open`, en Chrome):

![Cypress en modo visual con los tests de login en verde. En el sitio, el usuario de prueba está completo, la contraseña vacía y el navegador muestra "Completa este campo" debajo del campo de contraseña](img/f01-login-campos-vacios-validacion-navegador.png)

_Captura de Virginia (2026-11-06): test "con usuario completo y contraseña vacía" en verde. El usuario `qa_...` es un dato de prueba generado con Faker._

### 7. Lección aprendida

**La expectativa de un test sale de observar el sistema (o de su documentación), no de suponer.** Cuando no hay documentación, como en Buggy Cars, primero se observa el comportamiento y después se escribe la verificación. Al marcar el caso como "no confirmado" antes de correrlo, la falla se pudo identificar enseguida como un error del test y no como un bug.

**¿Es un bug de la app?** No. Como mucho es una **observación de UX**: el mensaje es el genérico del navegador, no uno propio de la app. Se menciona en ESTRATEGIA.md, no en BUGS.md.
