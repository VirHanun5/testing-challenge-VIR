# Challenge Técnico SDET — Petstore (API) + Buggy Cars (UI) con Cypress

[![CI](https://github.com/VirHanun5/testing-challenge-VIR/actions/workflows/ci.yml/badge.svg)](https://github.com/VirHanun5/testing-challenge-VIR/actions/workflows/ci.yml)

Suite de pruebas automatizadas de punta a punta: **API** (Swagger Petstore, recurso `/pet`), **UI** (Buggy Cars Rating), datos de prueba dinámicos y ejecución en **CI** con GitHub Actions.

Autora: **Virginia Hanun**. Uso de IA: ver la [sección final](#uso-de-ia).

📊 **Presentación resumida (7 slides):** [docs/presentacion.pdf](docs/presentacion.pdf)

## Qué cubre

| Parte           | Qué se automatizó                                                                                                                                                                                          | Resultado                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **1. API**      | Ciclo de vida de una mascota (alta → consulta → modificación → baja → 404), 2 negativos que cumplen la documentación y **7 hallazgos** donde la API no la cumple, con validación de **schema** y de campos | 6 tests estables ✅ · 7 hallazgos documentados (fallan a propósito) |
| **1. Opcional** | Colección de **Postman** equivalente, ejecutada con **Newman**                                                                                                                                             | 8 requests · 18 verificaciones ✅                                   |
| **2. UI**       | Registro, login exitoso, login fallido (credenciales inválidas y campos vacíos), voto con comentario y logout                                                                                              | 8 tests ✅                                                          |
| **3. CI**       | Lint + API + Newman + UI en **Chrome, Firefox y Edge** en cada push, con reportes como artifacts                                                                                                           | ✅                                                                  |
| **Bonus**       | [BUGS.md](BUGS.md) (8 bugs), [ESTRATEGIA.md](ESTRATEGIA.md) y ejecución en 3 navegadores                                                                                                                   | ✅                                                                  |

## Cómo instalar y correr

**Requisitos:** Node.js 24 y npm. (Probado en Windows 11 y en Ubuntu, en el CI).

```bash
git clone https://github.com/VirHanun5/testing-challenge-VIR.git
cd testing-challenge-VIR
npm ci
```

`npm ci` instala las versiones exactas de `package-lock.json` (incluido Cypress).

| Comando                           | Qué corre                                                                  |
| --------------------------------- | -------------------------------------------------------------------------- |
| `npm test`                        | Todo junto: API + UI (las suites estables)                                 |
| `npm run test:api`                | Solo la API (ciclo de vida + negativos)                                    |
| `npm run test:ui`                 | Solo la UI (Buggy Cars)                                                    |
| `npm run test:api:hallazgos`      | Los tests de hallazgos de Petstore (**fallan a propósito**: ver más abajo) |
| `npm run test:newman`             | La colección de Postman con Newman                                         |
| `npm run cy:open`                 | Cypress en **modo visual**, para ver cada test paso a paso                 |
| `npm run lint` / `npm run format` | Linter (ESLint) / formatter (Prettier)                                     |

Para otro navegador: `npm run test:ui -- --browser chrome` (o `firefox`, `edge`).

**Reporte:** cada ejecución genera `cypress/reports/index.html` (Mochawesome), con las **capturas de los tests que fallan** incrustadas. En el CI se publica como artifact: en [Actions](https://github.com/VirHanun5/testing-challenge-VIR/actions) → un run → sección **Artifacts** (`reporte-api`, `reporte-api-hallazgos`, `reporte-ui-chrome`, `reporte-ui-firefox`, `reporte-ui-edge`).

## Estructura del proyecto

```
├── .github/workflows/ci.yml        Pipeline de CI
├── cypress/
│   ├── e2e/
│   │   ├── api/                    API estable: ciclo de vida y negativos (deben pasar siempre)
│   │   ├── api-hallazgos/          API: hallazgos (esperan la documentación; hoy fallan)
│   │   └── ui/                     UI de Buggy Cars: registro, login, voto, logout
│   ├── pages/                      Page Objects (UI)
│   ├── schemas/                    JSON Schemas de la documentación de Petstore
│   ├── utils/                      Generadores de datos (Faker) y validador de schema (Ajv)
│   ├── fixtures/                   Datos fijos (modelo a votar)
│   └── support/                    Custom commands (cy.createPet, cy.loginByApi, ...)
├── postman/                        Colección y environment para Newman
├── docs/                           Exploración, hallazgos de la API, registro de fallas, capturas
├── BUGS.md · ESTRATEGIA.md
└── cypress.config.js · eslint.config.js · .prettierrc.json
```

## Patrón elegido: Page Object Model (POM)

Cada página (o componente) tiene una clase que **concentra sus selectores y acciones** (`RegisterPage`, `LoginHeader`, `ModelPage`). Los tests hablan en términos del negocio (`registerPage.register(user)`) y no conocen los selectores.

**Por qué:** si el sitio cambia un selector, se corrige **en un solo archivo** y todos los tests siguen andando. Es un patrón conocido y fácil de leer para cualquier persona del equipo. Lo complementan **custom commands** para lo que no es una página (crear datos y hacer login por API).

**Alternativa descartada:** App Actions (manipular la app por dentro). Es más rápida, pero acopla los tests al código interno de la app, que en este caso no es nuestro.

## Selectores

Buggy Cars **no tiene atributos `data-test` / `data-cy`**. Cómo se resolvió:

- **Registro:** los campos tienen **`id`** estables (`#username`, `#firstName`, `#lastName`, `#password`, `#confirmPassword`).
- **Login del header:** `input[name="login"]` es único; el formulario se ubica desde ese campo y la contraseña se busca **dentro** de él, porque en `/register` hay **dos** `name="password"`.
- **Botones y mensajes:** por el **texto que ve el usuario** (`cy.contains('button', 'Vote!')`, "Registration is successful").
- **Nunca clases de estilo** (`form-control`, `btn-success`): cambian con el diseño.

## Decisiones técnicas y trade-offs

| Decisión                                                                             | Por qué                                                                                                                                                                                                                                                                                                                                                    | Trade-off                                                                                                                  |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **JavaScript** (no TypeScript)                                                       | Lo domino y tengo que poder modificarlo en vivo                                                                                                                                                                                                                                                                                                            | El PDF dice que TS "suma": lo dejo para una siguiente versión                                                              |
| **Cypress para API (`cy.request`) y UI**                                             | La UI exige Cypress: una sola herramienta, configuración, reporte y pipeline                                                                                                                                                                                                                                                                               | Para API pura hay herramientas más livianas (Supertest)                                                                    |
| **Ajv + JSON Schema** copiado de la documentación                                    | El contrato es la documentación publicada, como pide el PDF                                                                                                                                                                                                                                                                                                | El schema valida la **forma**; los **valores** se validan aparte con `deep.equal`                                          |
| **Datos únicos con Faker**                                                           | Petstore y Buggy son entornos públicos: ids y usuarios únicos evitan choques                                                                                                                                                                                                                                                                               | En Buggy quedan usuarios de prueba creados (no hay API para borrarlos)                                                     |
| **Tests independientes**: cada test crea sus datos                                   | Pueden correr solos y en cualquier orden (requisito del PDF)                                                                                                                                                                                                                                                                                               | Más requests por ejecución                                                                                                 |
| **Limpieza en `afterEach`**                                                          | Corre aunque el test falle (verificado: después de una falla forzada, la mascota da 404)                                                                                                                                                                                                                                                                   | Si la ejecución se corta del todo, puede quedar una mascota                                                                |
| **Hallazgos sin forzar**, en carpeta y job aparte con `continue-on-error`            | Si la API no cumple su documentación, el test falla y se documenta ([docs/hallazgos-api.md](docs/hallazgos-api.md)); el job aparte evita que esas fallas conocidas tapen una falla nueva                                                                                                                                                                   | El job de hallazgos se ve en rojo (a propósito)                                                                            |
| **Alta de mascota: se valida el 200 observado**                                      | La documentación de `POST /pet` no declara la respuesta exitosa (hallazgo H7)                                                                                                                                                                                                                                                                              | Es una decisión, no un dato de la documentación                                                                            |
| **Esperar por requests** (`cy.intercept` + `cy.wait('@alias')`), nunca `cy.wait(ms)` | El test sigue apenas llega la respuesta. El linter (`cypress/no-unnecessary-waiting`) bloquea las esperas fijas                                                                                                                                                                                                                                            | —                                                                                                                          |
| **Login por API + `cy.session`** donde el login no es lo que se prueba               | Más rápido y no depende de la UI de login (que tiene sus propios tests). No guarda contraseñas: cachea el token en memoria durante la ejecución                                                                                                                                                                                                            | Con un usuario por test, el ahorro de `cy.session` es chico: se priorizó la independencia                                  |
| **Login con campos vacíos: se valida el mensaje del navegador, no un texto fijo**    | La app no muestra un mensaje propio: los campos son `required` y el **navegador** frena el envío con su aviso ("Completa este campo" / "Please fill out this field"). El test valida que el campo esté marcado como obligatorio, que haya un mensaje para mostrar (`validationMessage`) y que no se envíe el login ([F-01](docs/registro-fallas-tests.md)) | No se compara el texto exacto porque depende del idioma del navegador (el CI corre en inglés)                              |
| **Voto: "votos > antes"** y no "= antes + 1"                                         | El sitio es público: otra persona puede votar al mismo tiempo                                                                                                                                                                                                                                                                                              | —                                                                                                                          |
| **Modelo a votar con pocos comentarios** (Lancia Stratos)                            | La API manda todos los comentarios sin paginar y los modelos grandes tardan más de 4 s ([F-02](docs/registro-fallas-tests.md))                                                                                                                                                                                                                             | —                                                                                                                          |
| **Configuración fuera del código**                                                   | URLs en `cypress.config.js` (`baseUrl` y `expose`, leídas con `Cypress.expose()`); el `baseUrl` de Newman, en su environment                                                                                                                                                                                                                               | No hay secretos: si hubiera, irían en `cypress.env.json` (en `.gitignore`) o en GitHub Secrets y se leerían con `cy.env()` |
| **CI con los mismos comandos que en local** (no `cypress-io/github-action`)          | "El pipeline hace lo mismo que hago yo"                                                                                                                                                                                                                                                                                                                    | Sin caché del binario de Cypress: cada job lo descarga                                                                     |
| **Matrix de navegadores** con `fail-fast: false`                                     | Si falla un navegador, los otros terminan y se ve si es un problema puntual                                                                                                                                                                                                                                                                                | 3 jobs de UI por push                                                                                                      |
| **`npm audit`**: hay vulnerabilidades en herramientas de desarrollo                  | Las moderadas vienen de ESLint/Mocha y las altas/crítica, de **Newman 6.2.3** (sus dependencias internas). Corren solo en desarrollo/CI, con nuestra propia colección y contra APIs públicas de prueba                                                                                                                                                     | El "arreglo" que propone npm baja Newman a la 4.6.1 (más vieja): no se aplicó                                              |

## Hallazgos y bugs

- **API Petstore:** 7 diferencias entre la documentación y la API (por ejemplo, `PUT` sobre una mascota inexistente la **crea** en lugar de devolver 404). Detalle, evidencia y severidad: [docs/hallazgos-api.md](docs/hallazgos-api.md).
- **Buggy Cars:** 8 bugs reportados con pasos, esperado/obtenido, severidad, prioridad y capturas marcadas: [BUGS.md](BUGS.md).
- **Fallas de los propios tests** (falsos positivos) y cómo se corrigieron: [docs/registro-fallas-tests.md](docs/registro-fallas-tests.md).
- **Exploración manual** previa: [Petstore](docs/exploracion-petstore.md) y [Buggy Cars](docs/exploracion-buggy-cars.md).

## Técnicas de testing aplicadas (ISTQB)

- **Transición de estados:** ciclo de vida de la mascota (no existe → available → sold → eliminada).
- **Partición de equivalencia:** casos negativos de la API (id inexistente, id con formato inválido, payload inválido) y del login (contraseña incorrecta, usuario inexistente, campos vacíos).
- **Análisis de valores límite:** paginador del ranking (páginas 0, 1, 5, 6, 99) → BUG-01 y BUG-02.
- **Severidad vs prioridad:** en BUGS.md y en los hallazgos de la API.
- **Testing basado en riesgo:** qué se automatiza y en qué nivel, en [ESTRATEGIA.md](ESTRATEGIA.md).

## Qué agregaría o cambiaría con más tiempo

- **TypeScript**, para tipar los datos de prueba y los Page Objects.
- **Tests de API de Buggy Cars** (registro, voto, paginación): hoy la API acepta casos que la UI esconde (por ejemplo, `page=0` da 502).
- **Schemas de contrato** para las respuestas de Buggy Cars.
- **Pruebas de performance** de `/models/{id}` (k6) y **de accesibilidad** (axe).
- **Caché del binario de Cypress** en el CI y un **reporte unificado** de todos los jobs.
- **Ejecución programada** (por ejemplo, todas las noches) para detectar si Petstore corrige sus hallazgos.

## Uso de IA

El PDF permite usar IA. Usé **Claude (Anthropic)** como asistente para escribir código y documentación, con la regla de **no inventar nada**: cada hallazgo y bug está respaldado por una ejecución real, y las decisiones están explicadas para poder defenderlas. La exploración y el análisis se hicieron en conjunto con la IA: exploración manual del sitio como usuaria, aplicación de técnicas como valores límite y revisión del código del front y de las respuestas de la API. Cada bug y hallazgo fue reproducido y verificado antes de documentarlo. Las ejecuciones de los tests de UI las hice en mi PC. Los commits llevan la línea `Co-Authored-By` de Claude para que sea transparente.
