# Quiniela Britos

Aplicación web para simular jugadas de quiniela con persistencia por usuario en la nube. Trabajo práctico de aplicación serverless.

**URL de producción:** [https://tp1-front-ivo-2026.vercel.app](https://tp1-front-ivo-2026.vercel.app)

---

## Integrantes

- **Ignacio Britos** — [@IgnacioBritoss](https://github.com/IgnacioBritoss)
- *Por completar*

---

## Descripción

Quiniela Britos permite al usuario armar boletas de quiniela cargando números, cantidades de cifras (1, 2 o 3) y montos en tres modalidades de apuesta (a la cabeza, a los 5, a los 10). La app simula los sorteos, calcula los premios, mantiene estadísticas de frecuencias y guarda un historial por usuario. Incluye un generador de "número de la suerte" que sugiere números basándose en el historial de sorteos ya realizados.

Sin iniciar sesión la app funciona en modo local (los datos quedan en `localStorage`). Al iniciar sesión con Google, todas las jugadas, estadísticas y el historial pasan a persistirse en una base de datos PostgreSQL en la nube, asociados al usuario logueado.

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | [Astro](https://astro.build) v5 | La app ya estaba armada en Astro. Al migrar a modo `server` con el adapter de Vercel, ganamos SSR y rutas de API sin cambiar de framework. |
| Autenticación | OAuth 2.0 de Google implementado manualmente + JWT | Inicialmente se usó `auth-astro`, pero tiene un bug conocido en producción con Vercel donde detecta incorrectamente el host como `localhost`. Se optó por implementar el flujo OAuth desde cero usando los endpoints oficiales de Google y `jose` para firmar sesiones JWT. Más robusto y sin dependencias de terceros frágiles. |
| Base de datos | [Neon](https://neon.tech) (PostgreSQL serverless) | Integración nativa con Vercel, plan free generoso, driver serverless optimizado para funciones edge. |
| Driver SQL | `@neondatabase/serverless` | Driver oficial de Neon, compatible con serverless y templates tagged para queries seguras contra SQL injection. |
| CDN de avatars | [DiceBear](https://dicebear.com) | Servicio de generación de avatars SVG por URL. No requiere cuenta ni almacenamiento propio. |
| Deploy | [Vercel](https://vercel.com) | Deploy automático por cada push, integración nativa con Astro y Neon, variables de entorno gestionadas desde el panel. |

---

## Requisitos mínimos del TP cubiertos

- ✅ **Registro de usuario, inicio y cierre de sesión** (mediante Google OAuth).
- ✅ **Crear, visualizar y editar información asociada al usuario** (boletas, estadísticas, frecuencias de sorteos).
- ✅ **Persistencia en base de datos en la nube** (Neon PostgreSQL).
- ✅ **Despliegue web funcional** en Vercel.

---

## Funcionalidades

### Sin sesión iniciada
- Armado de boletas con múltiples números, cifras y montos.
- Simulación de sorteos.
- Cálculo de premios según las reglas clásicas de la quiniela.
- Generador de número de la suerte.
- Visualización de estadísticas locales (números calientes y fríos).
- Persistencia en `localStorage` del navegador.

### Con sesión iniciada
- Todo lo anterior, pero persistido en Neon en lugar de `localStorage`.
- Historial de las últimas 20 boletas jugadas por el usuario.
- Estadísticas generales acumuladas (boletas jugadas, dinero gastado, dinero ganado, balance).
- Frecuencias de 2 y 3 cifras acumuladas entre sesiones.
- Botón de reset que borra las estadísticas del usuario en la base de datos.

---

## Estructura del proyecto

```
quiniela-astro/
├── sql/
│   └── schema.sql              # Schema SQL de la base de datos
├── src/
│   ├── lib/
│   │   ├── db.ts               # Cliente de Neon
│   │   └── auth-helper.ts      # Helper de sesión + upsert de usuario
│   └── pages/
│       ├── api/
│       │   ├── boletas.ts      # GET/POST boletas del usuario
│       │   └── stats.ts        # GET/PUT/DELETE stats del usuario
│       └── index.astro         # Página principal con login
├── public/
│   ├── main.js                 # Lógica de quiniela del frontend
│   └── style.css
├── auth.config.ts              # Configuración de Auth.js + Google
├── astro.config.mjs            # Astro en modo SSR con adapter de Vercel
└── package.json
```

---

## Modelo de datos

Tablas propias (además de las requeridas por Auth.js):

- **`users`** — usuarios registrados (id, email, name, image).
- **`user_stats`** — una fila por usuario con estadísticas acumuladas y frecuencias (`jsonb`).
- **`boletas`** — historial de boletas jugadas; se mantienen solo las últimas 20 por usuario.
- **`jugada_favorita`** — jugada personalizada guardada por el usuario (por implementar en la entrega final).

El schema completo está en [`sql/schema.sql`](./sql/schema.sql).

---

## Correr el proyecto localmente

### Requisitos
- Node.js 18.20+ o 20.3+
- Una base de datos Neon (gratis en [neon.tech](https://neon.tech))
- Credenciales de Google OAuth ([Google Cloud Console](https://console.cloud.google.com))

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/IgnacioBritoss/tp1-front-ivo-2026.git
   cd tp1-front-ivo-2026
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear archivo `.env.local` con las variables:
   ```
   DATABASE_URL=postgresql://usuario:password@host/db
   AUTH_SECRET=un-string-random-largo
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=tu-client-secret
   ```

   Para generar `AUTH_SECRET`:
   ```bash
   npx auth secret
   ```

4. Crear el schema de la base de datos ejecutando el contenido de `sql/schema.sql` en el SQL Editor de Neon.

5. Correr en modo desarrollo:
   ```bash
   npm run dev
   ```

   La app queda disponible en `http://localhost:4321`.

### Redirect URIs que hay que registrar en Google Cloud

- `http://localhost:4321/api/auth/callback/google`
- `https://tp1-front-ivo-2026.vercel.app/api/auth/callback/google`

---

## Estrategia de ramas

Se sigue un flujo de tres niveles según pide el enunciado:

```
alumno1-britos  ──►  develop  ──►  main
```

- **`main`** — siempre funcional y desplegada en producción.
- **`develop`** — integración entre ambos alumnos.
- **`alumno1-britos`** — rama personal de Ignacio Britos.
- *(Por crear la rama del segundo integrante cuando se sume al proyecto.)*

Los cambios entran a `main` solo vía merge desde `develop`, que a su vez recibe merges desde las ramas personales.

---

## Estado del proyecto

### Entrega del 30/4 (parcial)
- [x] Setup inicial del repositorio y ramas.
- [x] Migración de Astro estático a Astro SSR desplegado en Vercel.
- [x] Base de datos Neon conectada y schema aplicado.
- [x] Autenticación con Google OAuth.
- [x] Persistencia de boletas y estadísticas por usuario.
- [x] Historial de últimas 20 boletas.

### Pendiente para la entrega final
- [ ] Jugada favorita personalizada del usuario (ya está el schema, falta UI + endpoints).
- [ ] Vista de historial de boletas anteriores en la UI.
- [ ] Edición de datos del usuario (nombre, avatar).
- [ ] Utilización de un CDN para imágenes de perfil.
- [ ] Suma del segundo integrante al proyecto.
- [ ] Uso consistente de Pull Requests para todos los merges.

---

## Decisiones técnicas relevantes

- **OAuth manual en vez de librería de auth.** Se intentó usar `auth-astro` pero presentaba un bug conocido en producción sobre Vercel donde el host se detectaba como `localhost`, rompiendo todo el flujo de signin con error 403 "Cross-site POST form submissions are forbidden". La solución definitiva fue implementar el flujo OAuth 2.0 de Google manualmente: endpoints propios `/api/auth/login`, `/api/auth/callback` y `/api/auth/logout`, manejo de sesión vía JWT firmado con `jose` y almacenado en cookies HttpOnly Secure SameSite=Lax. El helper `getOrigin()` lee `x-forwarded-host` y `x-forwarded-proto` para construir correctamente las URLs en entornos serverless.

- **`JSONB` para frecuencias y jugadas.** Las frecuencias son arrays de 100 y 1000 enteros; las jugadas y sorteos son estructuras variables. Guardarlos como `jsonb` evita normalizar y simplifica la lectura/escritura.

- **Modo dual (con y sin login).** La app no obliga a iniciar sesión. Sin login, los datos se guardan en `localStorage` como estaba originalmente; con login, se sincronizan contra Neon.

- **Límite de 20 boletas en historial.** Para evitar crecimiento ilimitado, cada insert ejecuta un `DELETE` que mantiene solo las 20 más recientes por usuario.

- **Validación de montos en 3 capas.** Frontend (HTML `max` + clamping JS) y backend (validación estricta contra límites conocidos). Evita que un usuario malicioso salte las validaciones del navegador y mande montos gigantes que rompan la DB.

- **Avatars desde CDN sin gestión de archivos.** DiceBear genera SVGs únicos por seed. No necesitamos storage ni uploads. Cumple el requisito de CDN del TP sin complejidad extra.