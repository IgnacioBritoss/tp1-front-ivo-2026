# CALIDAD.md — Estrategia de Calidad y CI/CD

## Estrategia general

El enfoque elegido para garantizar la calidad del proyecto es **calidad progresiva por capas**: primero validamos que el código es correcto a nivel sintáctico (lint), luego que la lógica de negocio funciona como se espera (tests unitarios), luego que el usuario puede usar la aplicación (tests E2E), y finalmente que el proyecto compila correctamente para producción (build).

Este orden no es arbitrario: detectar errores lo antes posible en el pipeline reduce el costo de corregirlos. Un error de lint se detecta en segundos; un error en producción puede llegar a los usuarios.

La prioridad estuvo en proteger la lógica de negocio central (cálculo de premios de la quiniela), ya que un bug ahí impacta directamente en la experiencia del usuario. El flujo de autenticación (login con Google) quedó fuera de cobertura de tests por la dificultad de mockear OAuth en un entorno de CI.

---

## Herramientas seleccionadas

### Tests unitarios: Vitest
Elegimos Vitest sobre Jest porque:
- Es el framework estándar en el ecosistema Astro/Vite, requiere configuración mínima.
- Compatible con TypeScript y ES modules nativamente, sin configuraciones adicionales.
- La sintaxis es idéntica a Jest (`describe`, `it`, `expect`), lo que hace fácil entender los tests.
- Más rápido que Jest en proyectos Vite gracias al transform compartido.

### Tests E2E: Playwright
Elegimos Playwright sobre Cypress porque:
- Tiene mejor soporte para aplicaciones SSR (Server Side Rendering) como la nuestra con Astro.
- El modo `webServer` en la configuración permite iniciar el servidor de desarrollo automáticamente antes de correr los tests, sin scripts adicionales.
- Los selectores son más expresivos y estables (`getByRole`, `getByText`).
- Corre nativamente en Chromium, Firefox y WebKit; en CI usamos solo Chromium para ahorrar tiempo.

### Lint: ESLint + typescript-eslint
ESLint con el preset `recommended` de `typescript-eslint` es el estándar de facto para proyectos TypeScript. Evaluamos Biome (más rápido, sin dependencias) pero lo descartamos porque tiene menos plugins y su ecosistema aún está madurando. Para este proyecto, ESLint es suficiente y bien conocido.

### CI/CD: GitHub Actions
La integración nativa con GitHub lo convierte en la opción obvia: no requiere configurar webhooks ni cuentas externas. El deploy a Vercel está gestionado por la integración nativa de Vercel con GitHub: cada push que llega a `main` dispara un deploy automático. GitHub Actions actúa como **gate de calidad**: si el pipeline falla, el PR no puede mergearse a `main` (branch protection rules), y por ende Vercel no despliega código que no pasó los checks.

---

## Tests desarrollados

### Tests unitarios (`src/lib/__tests__/game-logic.test.ts`)

Las funciones puras de negocio fueron extraídas de `public/main.js` a `src/lib/game-logic.ts` para poder importarlas en los tests. Los tests cubren:

| Test | Función | Comportamiento que valida |
|------|---------|--------------------------|
| `completarConCeros - rellena con ceros` | `completarConCeros` | El número 5 con 3 cifras resulta en "005"; el 42 resulta en "042". Cubre el formateo de números en boletas y resultados. |
| `completarConCeros - no agrega ceros innecesarios` | `completarConCeros` | Un número que ya tiene la longitud correcta no se modifica (123 → "123"). |
| `calcularCostoTotal - suma apuestas y sorteos` | `calcularCostoTotal` | El costo total es la suma de todas las apuestas individuales multiplicada por la cantidad de sorteos. Es la fórmula que el usuario ve antes de jugar. |
| `calcularCostoTotal - lista vacía devuelve 0` | `calcularCostoTotal` | Sin jugadas, el costo es 0. Evita errores de renderizado con `$0`. |
| `calcularPremioDeUnSorteo - cabeza en 3 cifras` | `calcularPremioDeUnSorteo` | Cuando el número jugado (677) coincide con el primer número del sorteo, el premio es `apuesta × 600`. Es el pago más alto del juego. |
| `calcularPremioDeUnSorteo - sin aciertos` | `calcularPremioDeUnSorteo` | Cuando el número no aparece en el sorteo, el premio es 0 y la lista de aciertos está vacía. |
| `calcularPremioDeUnSorteo - "a los 5" en 2 cifras` | `calcularPremioDeUnSorteo` | Cuando el número aparece entre los primeros 5 del sorteo (no en cabeza), se cobra la apuesta de "a los 5" con multiplicador 14. Valida los rangos de pago diferenciados. |
| `calcularPremioDeUnSorteo - cabeza en 2 cifras` | `calcularPremioDeUnSorteo` | Cabeza en 2 cifras paga 70x. Verifica que el multiplicador cambia según la cantidad de cifras. |
| `calcularPremioDeUnSorteo - 1 cifra ignora apuestas de cinco y diez` | `calcularPremioDeUnSorteo` | Para números de 1 cifra, solo se puede ganar "cabeza" (7x). Las apuestas de "a los 5" y "a los 10" son ignoradas aunque estén cargadas. |

### Tests E2E (`tests/e2e/main-flow.spec.ts`)

Cubren el flujo de usuario no autenticado usando Playwright contra el servidor de desarrollo:

| Test | Comportamiento que valida |
|------|--------------------------|
| `la página principal carga y muestra el título` | El servidor responde, renderiza la app, y el título del documento y el h1 dicen "Quiniela Britos". Caso base de toda la aplicación. |
| `usuario no autenticado ve el botón de login con Google` | Sin sesión activa, el botón "Ingresar con Google" está visible. Si el botón desaparece, el flujo de autenticación está roto. |
| `la tabla de jugadas se inicializa con 3 filas por defecto` | Verifica que el JavaScript del cliente se ejecuta correctamente tras el SSR y crea la tabla inicial. |
| `el botón Jugar ahora está visible` | El botón principal de acción está presente. Si desaparece, el flujo de juego está roto para todos los usuarios. |
| `el selector de cantidad de números está presente y acepta input` | El input de cantidad está en el DOM y tiene valor inicial 3. |
| `cambiar cantidad de sorteos actualiza el preview` | El preview de la boleta reacciona a cambios en el input. Valida la reactividad del JS de cliente. |

---

## Casos de uso críticos

Los flujos priorizados para cobertura de tests son:

1. **Cálculo de premios** (`calcularPremioDeUnSorteo`): Es el núcleo del negocio. Un bug aquí significa que los usuarios reciben montos incorrectos. Se testea con múltiples combinaciones: cabeza, "a los 5", sin aciertos, y las 3 variantes de cifras (1, 2 y 3).

2. **Cálculo de costo de boleta** (`calcularCostoTotal`): El usuario decide si jugar basándose en este número. Un error haría que el costo mostrado no coincida con el cobrado.

3. **Renderizado para usuario no autenticado**: La app funciona sin login (modo localStorage). Un error en el SSR que rompa el renderizado afecta al 100% de los usuarios nuevos o no registrados. El test E2E cubre este caso.

4. **Formateo de números** (`completarConCeros`): Un número mal formateado ("5" en lugar de "005") confunde al usuario sobre el número que jugó.

Lo que **no** se priorizó: el flujo autenticado (login OAuth, guardar boletas en DB, historial). La dificultad de mockear Google OAuth en CI supera el beneficio para el alcance de este TP.

---

## Pipeline de CI/CD

El pipeline se define en `.github/workflows/ci.yml` y se dispara en cada push o PR a `main` o `develop`.

### Estructura del pipeline

```
push/PR → lint → unit-tests → e2e-tests → build
                           ↘             ↗
                            (paralelos)
```

**Job `lint`** (`npm run lint`):
Corre ESLint sobre `src/**/*.ts`. Es el primer job y todos los demás lo esperan. Si hay errores de tipo o código inválido, el pipeline falla rápido sin gastar tiempo en tests o builds.

**Job `unit-tests`** (`npm run test`):
Corre Vitest. Requiere que `lint` pase. Los tests unitarios son deterministas y rápidos (~200ms). Si la lógica de negocio está rota, no tiene sentido seguir con E2E.

**Job `e2e-tests`** (`npm run test:e2e`):
Requiere que `unit-tests` pase. Playwright inicia automáticamente el servidor de desarrollo (`astro dev`) con variables de entorno simuladas. Los tests E2E solo ejercen el flujo sin login, que no hace consultas reales a la base de datos, por lo que una `DATABASE_URL` falsa es suficiente.

**Job `build`** (`npm run build`):
Corre `astro build` con variables de entorno simuladas. Verifica que el código que pasó los tests también puede compilar para producción. Corre en paralelo con `e2e-tests` para optimizar el tiempo total del pipeline.

### Decisiones de diseño del pipeline

- **El deploy no está en GitHub Actions**: Vercel tiene integración nativa con GitHub y deploya automáticamente en cada push a `main`. No agregamos un step de deploy en GitHub Actions para evitar duplicar la lógica y mantener las credenciales de Vercel fuera del repositorio. El "gate" de calidad se implementa a través de branch protection rules en `main`, que requieren que todos los jobs del CI pasen antes de permitir el merge.

- **Variables de entorno simuladas en CI**: La base de datos (Neon PostgreSQL) no es consultada durante el build ni durante los tests E2E del flujo sin login. Se usan valores falsos para `DATABASE_URL`, `AUTH_SECRET`, etc. Las credenciales reales solo existen en el dashboard de Vercel.

- **`astro dev` en lugar de `astro build` + `astro preview` para E2E**: El adaptador `@astrojs/vercel` genera output en formato Vercel, no en formato Node.js estándar. `astro dev` no usa el adaptador y provee un servidor SSR funcional para testing, lo que simplifica el pipeline.

---

## Limitaciones y deuda técnica

1. **El flujo autenticado no tiene cobertura E2E**: Login con Google OAuth, guardar boletas, ver historial de servidor, jugada favorita, todas son funcionalidades críticas sin tests automáticos. Requeriría mockear el proveedor OAuth o mantener un usuario de testing con credenciales reales en los secrets de CI.

2. **Lógica de negocio duplicada**: Las funciones puras se extrajeron a `src/lib/game-logic.ts` para ser testeables, pero `public/main.js` mantiene sus propias copias del mismo código. Idealmente, `main.js` importaría desde `game-logic.ts` mediante bundling (ej. con un bundler como Rollup o usando `<script type="module">`). Esta deuda existe porque refactorizar `main.js` estaba fuera del scope del TP.

3. **Sin tests para los API handlers**: Los endpoints `/api/boletas`, `/api/stats`, `/api/me`, etc. no tienen tests automáticos. Un mock del cliente de Neon (`vi.mock('./db')`) permitiría testear estos handlers sin una base de datos real.

4. **E2E corre contra el servidor de desarrollo, no contra el build de producción**: Hay diferencias entre `astro dev` y el output del adaptador de Vercel (ej. headers, edge functions). Un bug específico del adaptador podría pasar desapercibido.

5. **Sin alertas de regresión de performance**: No hay medición de tiempos de carga ni alertas si el bundle crece. Lighthouse CI o similar podría agregarse como job opcional.

---

## Uso de IA para generación de tests

Esta sección documenta el uso de **Claude Code** (claude-sonnet-4-6) como asistente de IA durante el desarrollo del TP3.

### Qué generó la IA

- La estructura inicial de `src/lib/game-logic.ts` (extracción de funciones puras desde `public/main.js`)
- Los casos de test unitarios para `calcularPremioDeUnSorteo`, `completarConCeros` y `calcularCostoTotal`
- La configuración de Vitest, Playwright y ESLint
- El workflow de GitHub Actions en `.github/workflows/ci.yml`
- El PR template en `.github/PULL_REQUEST_TEMPLATE.md`
- Este documento `CALIDAD.md`

### Qué revisamos y modificamos

- Verificamos que cada test unitario corresponde exactamente a la lógica implementada en `public/main.js`. Los multiplicadores de pago (600x cabeza 3 cifras, 70x cabeza 2 cifras, 7x cabeza 1 cifra, etc.) fueron cross-checked línea por línea.
- Verificamos que los tests E2E reflejan el comportamiento real de la UI: la tabla se inicializa con 3 filas (no con 0), el input de sorteos tiene valor inicial 1, etc.
- Verificamos que las variables de entorno simuladas en CI son suficientes para que `astro dev` arranque sin errores y sin consultar la base de datos real.
- El PR template fue ajustado para que el checklist refleje exactamente los comandos reales del proyecto.

### Criterio de confianza

La IA ayudó con boilerplate y estructura, pero cada test fue validado contra la implementación real. El criterio fue siempre: **¿este test falla si rompemos la función que testea?** Para `calcularPremioDeUnSorteo`, lo verificamos cambiando el multiplicador de 600 a 601 y confirmando que el test falla. Para los tests E2E, verificamos que seleccionan elementos reales del DOM actual.

---

## Branch naming convention

| Tipo | Prefijo | Ejemplo |
|------|---------|---------|
| Feature nueva | `feature/` | `feature/historial-boletas` |
| Bug fix | `fix/` | `fix/calculo-premio-1-cifra` |
| CI/CD o infra | `ci/` | `ci/github-actions-pipeline` |
| Refactor | `refactor/` | `refactor/extraer-game-logic` |
| Documentación | `docs/` | `docs/calidad-md` |

Ningún cambio se mergea directo a `main` o `develop`. Todo pasa por un PR que referencia el issue que resuelve (`Closes #N`) y requiere revisión del otro integrante.
