# Exploración manual — Buggy Cars Rating

- **Fecha:** 2026-11-05
- **Sitio:** https://buggy.justtestit.org/
- **Navegador:** Chromium (panel de navegador de la app) · Windows 11
- **Alcance de esta parte:** páginas públicas, estructura de los formularios y API que consume el sitio. Los flujos con cuenta (registro, login, voto y logout) se exploran a mano en la sección 5.

## 1. Arquitectura observada

- Es una **SPA** (_Single Page Application_, hecha en Angular): el navegador carga una sola página y después pide los datos a una API.
- **API:** `https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod` (AWS API Gateway).
- Endpoints que aparecen en el código de la app: `/oauth/token` (login), `/users` (registro), `/users/current`, `/users/profile`, `/dashboard`, `/models?page=N`, `/models/{id}`, `/makes/{id}` y `/vote`.
- Requests observados al navegar:

| Página          | URL                                                                            | Request a la API                 |
| --------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| Home            | https://buggy.justtestit.org/                                                  | `GET /dashboard`                 |
| Ranking general | https://buggy.justtestit.org/overall                                           | `GET /models?page=1` (5 páginas) |
| Modelo (Diablo) | https://buggy.justtestit.org/model/ckl2phsabijs71623vk0%7Cckl2phsabijs71623vqg | `GET /models/{id}`               |

**Uso para la automatización:** estos requests son los que esperamos con `cy.intercept()` + `cy.wait('@alias')`, en lugar de usar esperas fijas.

## 2. Rutas de la app

`/` · `/register` · `/profile` · `/make/:id` · `/model/:id` · `/overall` (también figuran `admin` y `users` en el código).

## 3. Selectores disponibles

- **No hay atributos `data-*`** (`data-test`, `data-cy`) en ninguna página revisada.
- **Formulario de registro** (https://buggy.justtestit.org/register): cada campo tiene `id`, `name` y `formcontrolname` iguales, que son estables y no dependen del estilo.

| Campo (label)    | Selector estable                                                                      |
| ---------------- | ------------------------------------------------------------------------------------- |
| Login            | `#username`                                                                           |
| First Name       | `#firstName`                                                                          |
| Last Name        | `#lastName`                                                                           |
| Password         | `#password`                                                                           |
| Confirm Password | `#confirmPassword`                                                                    |
| Botón Register   | `button[type="submit"]` dentro del formulario de registro (arranca **deshabilitado**) |

- **Login del header** (en todas las páginas): `input[name="login"]`, `input[name="password"]` y el botón `Login` (`type="submit"`), dentro de `form.form-inline`.
- ⚠️ **Ambigüedad:** en `/register` hay **dos** campos con `name="password"` (el del header y el del formulario). Por eso para el registro se usa `#password` y para el login se acota al formulario del header.
- Las clases (`form-control`, `btn-success`, `ng-untouched`...) son de **estilo o de estado de Angular**: no se usan como selectores porque cambian.

## 4. Candidatos a bug (falta reproducirlos a mano y capturarlos)

- **C1 — La velocidad máxima del Lamborghini Diablo es 25 km/h** (tipo: **defecto de datos / información incongruente**; oráculo: consistencia con los demás modelos y con la propia descripción). En la página del modelo dice "Max Speed: 25km/h", y la API devuelve `"maxSpeed": 25`. Los demás modelos de la marca tienen entre 330 y 355 km/h (Reventón 330, Aventador 350, Veneno 355, Murciélago 342), y la descripción del Diablo habla de un V-12 de 543 hp. El dato está mal **de origen** (en la API), no en la pantalla.
- **A verificar con sesión iniciada:** sin sesión, la API devuelve los 3684 comentarios del Diablo con `"user": ""` (sin autor). Puede ser intencional (no mostrar autores a visitantes) o un bug. Se confirma al votar: ¿aparece tu nombre como autor del comentario?
- **C2 — El campo de contraseña del login no indica qué hay que escribir** (detectado a simple vista). En el header, el primer cuadro dice "Login" (placeholder) y el segundo está **vacío**: no tiene placeholder, ni `label`, ni `aria-label`, ni `title`. Ninguno de los dos campos tiene `label` (el formulario tiene 0). Además, "Login" es ambiguo como nombre del campo de usuario porque el botón de al lado también se llama "Login". Es un problema de **usabilidad** (el usuario tiene que adivinar) y de **accesibilidad** (un lector de pantalla anuncia "campo de contraseña" sin nombre). Evidencia: captura de la exploración + atributos leídos del HTML (`input[name="password"]` con `type="password"` y sin placeholder). Falta: captura marcada en `docs/img/`.
- **C3 — El campo de usuario se llama "Login" en todo el sitio y no explica qué dato pide**. En `/register` la etiqueta es "Login" y en el header el placeholder también es "Login", igual que el botón. No queda claro si es un nombre de usuario o un email. Según el código, es un **nombre de usuario** (`username`, tipo texto, máximo 50 caracteres), **no un email**. Esperado: una etiqueta clara ("Username" / "Usuario") con una ayuda breve.
- **C4 — Mensaje de error equivocado en "Last Name"**: en https://buggy.justtestit.org/register, si escribís algo en **Last Name** y lo borrás, debajo aparece **"First Name is required"** (debería decir "Last Name is required"). Confirmado en pantalla y en el template de la app (el bloque de validación de `lastName` tiene el texto de `firstName`). No requiere cuenta ni enviar el formulario. Reproducido 2 de 2 (2026-11-05 y 2026-11-07) → **confirmado como BUG-03** en BUGS.md.
- **C5 — El registro no indica qué campos son obligatorios**. Los 5 campos son obligatorios (`required` en el HTML y `Validators.required` en Angular), pero ninguna etiqueta tiene asterisco y no hay una leyenda tipo "* Campo obligatorio". La única señal visual es una barra roja de 5 px (`rgb(169, 68, 66)`) a la izquierda de cada campo, que aparece **antes de que el usuario escriba nada** y no se explica en ningún lado. Además, indicar algo **solo con color** es un problema de accesibilidad (no lo perciben personas con daltonismo). Esperado: un asterisco en cada etiqueta y una leyenda que lo explique. Esto último es una convención de usabilidad; la posición de la leyenda (arriba o abajo) es una decisión de diseño.
- **C6 — El paginador del ranking deja ir más allá de la última página** (técnica: **análisis de valores límite**). En https://buggy.justtestit.org/overall:
  - Con la flecha **»**: en "page 5 of 5" la flecha sigue habilitada y lleva a **"page 6 of 5"**, "page 7 of 5"... con la **tabla vacía** y sin ningún mensaje. En cambio, **«** sí aparece deshabilitada en la página 1 (`class="btn disabled"`), así que el comportamiento es inconsistente.
  - Escribiendo **6** o **99** en el campo de página + Enter: pide `GET /models?page=6` (o 99) y muestra "page 6 of 5" / "page 99 of 5" con la tabla vacía.
  - Reproducido: flecha (2 veces; una de ellas a mano avanzando hasta **"page 10 of 5"**), escribir 6 (2 veces: con eventos simulados y con teclado real), escribir 99 (1 vez). No se observó ningún límite superior (se probó hasta 99). Evidencia: `docs/img/exp-c6-paginador-page-6-of-5-tabla-vacia.jpg`.
- **C7 — Escribir la primera o la última página en el paginador no hace nada, pero el campo muestra el número escrito** (valores límite). Estando en la página 1, escribir **5** + Enter: el campo dice "5", la etiqueta sigue en **"page 1 of 5"**, la tabla no cambia y **no sale ningún request**. Lo mismo pasa al escribir **1** estando en la página 3. Las páginas intermedias (2, 3) funcionan bien. La pantalla queda contradiciéndose: el campo dice una página y la etiqueta y la tabla muestran otra. Reproducido: escribir 5 (2 veces: desde la página 3 con eventos simulados y desde la página 1 con teclado real), escribir 1 (1 vez). Evidencia: `docs/img/exp-c7-paginador-escribe-5-sigue-en-1.jpg`.
  - **Causa (vista en el código del front, a título informativo):** el componente del paginador tiene una bandera `buggy`. Con esa bandera activa, se ignora el Enter cuando el número es 1 o igual al total de páginas, y no se limita el máximo (`!this.buggy && e > this.totalPages`). El mínimo sí se limita: 0 o negativos se convierten en 1.
- **Observación de API (no alcanzable desde la UI):** `GET /models?page=0` y `GET /models?page=-1` devuelven **502 `{"message": "Internal server error"}`**, en lugar de un 400 o de la página 1. Desde la pantalla no se llega a esto porque el front convierte 0 en 1; solo se alcanza llamando a la API directamente. `page=abc` y `page=1.5` devuelven la página 1. Va a ESTRATEGIA.md como argumento para probar también la API de Buggy Cars, no solo la UI.
- **Reglas de contraseña — RESUELTO, ver C9** (caso "a": el servidor rechaza y la regla no se avisó antes). Análisis original: en el front la contraseña **solo es obligatoria** (`Validators.required`); no hay reglas de largo o complejidad ni ayuda visible. Falta probar a mano qué pasa al enviar contraseñas débiles: (a) si el servidor las **rechaza** con una regla que no se avisó antes → defecto de usabilidad (las reglas aparecen recién después del error); (b) si las **acepta** (por ejemplo `1`) → defecto de seguridad (política de contraseñas débil).
- **Comportamiento esperado después de registrarse (según el template de la app):** aparece un aviso verde **"Registration is successful"** debajo de los botones y se vacían los campos. **No** redirige al login ni inicia sesión sola. Si falla, muestra el error del servidor en un aviso rojo. El botón Register se habilita solo cuando los 5 campos son válidos y las contraseñas coinciden ("Passwords do not match" si no coinciden). → El texto "Registration is successful" es lo que va a validar Cypress en el Día 4.
- **C9 — La contraseña exige un mínimo de 6 caracteres que no se avisa, y el error que se muestra es técnico**. El campo Password no tiene ninguna indicación de reglas, y en el front solo es obligatorio (`Validators.required`). Al registrarse con una contraseña corta, el servidor la rechaza y la app muestra el mensaje crudo: **`InvalidParameter: 1 validation error(s) found. - minimum field size of 6, SignUpInput.Password.`** Problemas: (1) la regla se conoce **recién después del error**; (2) el mensaje usa nombres internos (`InvalidParameter`, `SignUpInput.Password`) que un usuario no entiende; (3) expone detalles de la implementación. Por el formato, parece un mensaje del servicio de AWS que usa el backend (sospecha, no comprobado). Esperado: informar la regla junto al campo antes de enviar y, si falla, un mensaje claro ("La contraseña debe tener al menos 6 caracteres"). Reproducido 2 de 2 (2026-11-05 y 2026-11-07) → **confirmado como BUG-06** en BUGS.md.
- **C10 (candidato, a confirmar con cuenta) — El Logout no funciona estando en el ranking (`/overall`).** Visto en el código del front (2026-11-07): al abrir la página del ranking (componente `my-overall`), la app ejecuta `breakLogout()` (y `breakTwitter()`), y al salir de esa página ejecuta `reset()`. El link Logout pasa por `if (!brokenService.isLogoutBroken()) logout()`. O sea: **en https://buggy.justtestit.org/overall el click en Logout no haría nada**, y en el resto de las páginas sí funcionaría. **Confirmado a mano (2026-11-07)**: en /overall el Logout no hace nada y en /register funciona → **BUG-07** en BUGS.md.
- **C11 — Después del Logout estando en el perfil, los datos personales siguen visibles.** Propuesto a partir de una observación de la exploración (después del logout se queda en la misma página) y del código (my-profile no escucha el evento de logout; el guard de /profile solo actúa al entrar). **Confirmado a mano (2026-11-07)**: header sin sesión, URL /profile, usuario, nombre, dirección y teléfono a la vista → **BUG-08** en BUGS.md. (En las páginas públicas, quedarse en la misma página después del logout es una sugerencia, no un bug).
- **C8 (observación visual, NO confirmado como funcional) — Después de un registro exitoso, el formulario vacío queda "válido" y el botón Register habilitado.** En las pruebas manuales, el formulario **nunca** permitió registrar datos vacíos; solo se habilita Register cuando todos los campos están completos. Queda como inconsistencia visual (barras verdes con campos vacíos después del registro, rojas al cargar la página), salvo que una prueba específica (presionar Register justo después del éxito sin tocar nada) muestre otra cosa. Lo que sigue es el análisis original: Observado en la exploración (la captura no se publica porque tiene datos personales): tras "Registration is successful", los 5 campos quedan **vacíos con la barra verde** (al cargar la página, vacíos, están en rojo) y el botón Register **no está gris**. Causa en el código: `onSuccess` hace `updateValue("")` y `setErrors(null)` en cada campo, o sea, borra los valores **y también los errores**, y el botón depende de `!registerForm.valid`. **Falta probar:** presionar Register de nuevo sin escribir nada. Posibles resultados: (a) el servidor crea un usuario vacío → defecto grave de integridad de datos; (b) el servidor devuelve un error → la validación del front queda anulada y el usuario ve un error confuso; (c) no pasa nada → solo inconsistencia visual.
- **Posible problema de feedback:** en una prueba manual no se vio el aviso "Registration is successful" en el momento. El aviso aparece **debajo** de los botones, al final del formulario. A confirmar: ¿queda fuera de la pantalla sin hacer scroll?
- **Login fallido (observado en las pruebas manuales):** con usuario o contraseña incorrectos aparece el aviso **"Invalid username/password"** y los dos campos quedan con lo que se escribió. → Ese texto exacto es el que va a validar Cypress en el Día 5.
  - **No se registra como bug:** mantener el usuario después de un error es una práctica de usabilidad aceptada (el usuario corrige solo lo que escribió mal). **Sugerencia de mejora:** limpiar solo el campo de contraseña.
  - **Punto positivo:** el mensaje es **genérico** (no dice si falló el usuario o la contraseña). Es una buena práctica de seguridad, porque no le revela a un atacante qué usuarios existen (evita la "enumeración de usuarios"). **Confirmado:** el mensaje es el mismo con un usuario inexistente que con una contraseña incorrecta.
- **Aclaración:** el generador de "contraseña segura" que aparece al registrarse es del **navegador** (Administrador de contraseñas de Google), **no del sitio**. No cuenta como que Buggy Cars ayude con la contraseña.
- **Sugerencias de mejora (no son bugs):** un indicador de fortaleza de la contraseña (baja / media / alta) y un tooltip con las reglas; **verificar el email** de la cuenta (hoy el sitio no pide email: el campo "Login" es un nombre de usuario); después de registrarse, llevar al usuario al login o iniciar la sesión automáticamente. Van en una sección aparte de BUGS.md o en ESTRATEGIA.md.
- **Observación (no es bug por sí sola):** la página del Diablo carga los 3684 comentarios juntos, sin paginar. Es un posible problema de rendimiento para ESTRATEGIA.md.

## 5. Guía de exploración manual con cuenta

Anotar el **texto exacto** de cada mensaje y sacar una captura (Win+Shift+S) de todo lo raro. Guardar las capturas en `docs/img/` con nombres como `exp-01-registro-ok.png`. Recomendado: tener abierto **DevTools → Network** (F12) para ver los requests a la API.

**A. Registro** — https://buggy.justtestit.org/register

1. Mirá el botón **Register**: ¿está deshabilitado con el formulario vacío?
2. Registrate con un usuario nuevo (por ejemplo `vir_exp_<fecha>`) y una contraseña que cumpla las reglas. Anotá el mensaje de éxito y qué request aparece en Network (esperado: `POST /users`).
3. Probá registrar **el mismo usuario otra vez**: ¿qué mensaje sale?
4. Probá contraseñas débiles (corta, sin mayúscula, sin número, sin símbolo): ¿qué reglas exige y qué mensaje muestra cada vez? (Partición de equivalencia: una clase por regla).
5. Probá que **Password** y **Confirm Password** no coincidan: ¿se avisa?

**B. Login** — con el formulario del header

1. Login **correcto** con el usuario recién creado: ¿qué cambia en el header? (Esperado: un saludo con tu nombre y los links Profile / Logout). Request esperado: `POST /oauth/token`.
2. Login con **contraseña incorrecta**: texto exacto del mensaje y dónde aparece.
3. Login con **usuario inexistente**: ¿el mensaje es el mismo?
4. Login con **campos vacíos**: ¿deja hacer click? ¿qué mensaje sale?

**C. Voto con comentario** — elegí un modelo **distinto del Diablo** (por ejemplo desde https://buggy.justtestit.org/overall)

1. Con la sesión iniciada, escribí un comentario y votá. Anotá el número de **Votes** antes y después.
2. ¿Aparece tu comentario en la tabla? ¿Con **tu nombre** en Author? (verifica el candidato de autores vacíos)
3. Recargá la página: ¿podés votar de nuevo? ¿Qué mensaje sale?
4. Request esperado en Network: `POST .../vote`.

**D. Perfil y logout**

1. Entrá a **Profile**: ¿se ven tus datos? (opcional: probá cambiar algo).
2. **Logout**: ¿vuelve a aparecer el formulario de login? Recargá: ¿la sesión sigue cerrada?

**E. Candidato C1**

1. Abrí https://buggy.justtestit.org/model/ckl2phsabijs71623vk0%7Cckl2phsabijs71623vqg y fijate en **Max Speed**. Captura con la marca sobre el valor.
