# Parametrizador de Unidades de Venta Minorista

App de una sola página (`index.html`) para diseñar la planta de un local
retail, colocar mobiliario/racks/servicios, calcular costos y ver un render
3D esquemático — con guardado de proyectos en Cloudflare D1 vía Pages
Functions.

## Estructura del repo

```
/index.html
/schema.sql
/functions/
  /_shared/
    catalog.js       -> catálogo espejo del frontend (para que la IA solo use "keys" válidas)
    anthropic.js      -> helper para llamar a la API de Anthropic desde el servidor
  /api/
    /projects/
      index.js        -> GET (listar) y POST (crear) en /api/projects
      [id].js          -> GET, PUT, DELETE en /api/projects/:id
    /ai/
      layout-assistant.js  -> POST /api/ai/layout-assistant   (asistente por lenguaje natural)
      detect-walls.js       -> POST /api/ai/detect-walls       (contorno del plano por visión)
      suggest-layout.js     -> POST /api/ai/suggest-layout     (distribución inicial por giro+área)
      narrative.js           -> POST /api/ai/narrative          (recomendación de normativa + resumen del PDF)
```

Las carpetas que empiezan con `_` (como `_shared`) no se publican como rutas — Cloudflare Pages las trata solo como código compartido que las demás Functions pueden importar.

Sube esta estructura tal cual a la raíz de tu repo de GitHub — Cloudflare
Pages detecta automáticamente la carpeta `/functions` y publica cada
archivo como un endpoint.

## 1. Crear la base de datos D1

Con Wrangler (CLI):

```bash
wrangler d1 create parametrizador-db
```

Esto te da un `database_id`. Después corre el esquema:

```bash
wrangler d1 execute parametrizador-db --remote --file=./schema.sql
```

(Usa `--local` primero si quieres probarlo en tu máquina con `wrangler pages dev`.)

También puedes crear la base y correr el SQL desde el dashboard de
Cloudflare: **Workers & Pages → D1 → Create database**, y pegar el
contenido de `schema.sql` en la pestaña **Console**.

## 2. Conectar el repo como proyecto de Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Selecciona tu repositorio.
3. Build settings: **no build command**, output directory `/` (la raíz).
4. Despliega.

## 3. Enlazar la base D1 al proyecto de Pages

En el proyecto ya creado: **Settings → Functions → D1 database bindings**
→ **Add binding**:

- Variable name: `DB`  *(el código en `functions/api/...` usa exactamente este nombre)*
- D1 database: `parametrizador-db`

Vuelve a desplegar (o espera al siguiente push) para que el binding tome efecto.

## 4. Conectar la API de Anthropic (para las 5 funciones de IA)

1. Proyecto de Pages → **Settings** → **Environment variables**.
2. En la sección de **Production** (y repite en **Preview** si la usas) → **Add variable**.
3. Nombre: `ANTHROPIC_API_KEY`. Marca la opción de **Encrypt** (guardarla como secreto, no en texto plano).
4. Pega tu clave de la consola de Anthropic (console.anthropic.com → API Keys).
5. Guarda y vuelve a desplegar (igual que con el binding de D1 — el cambio no aplica al deployment que ya está corriendo).

**Nunca** pongas la clave dentro de `index.html` ni de ningún archivo que se sirva al navegador — por eso vive solo en las variables de entorno de la Function, del lado del servidor.

### Las 5 funciones de IA

| Función | Endpoint | Qué hace |
|---|---|---|
| Asistente de layout | `/api/ai/layout-assistant` | Traduce instrucciones en español ("agrega 3 racks de abarrotes cerca de la entrada") a acciones sobre el plano |
| Detección de contorno | `/api/ai/detect-walls` | Analiza la imagen del plano subido y propone el polígono del contorno exterior |
| Distribución inicial | `/api/ai/suggest-layout` | Dado un giro de negocio y área en m², propone una mezcla inicial de mobiliario/racks/servicios |
| Validación de normativa | `/api/ai/narrative` (kind=compliance) | Redacta una recomendación a partir de un chequeo de reglas (anchos de pasillo, traslapes, % de circulación) que se calcula en el navegador, sin costo de IA |
| Resumen ejecutivo del PDF | `/api/ai/narrative` (kind=pdf_summary) | Redacta el párrafo introductorio del PDF exportado |

Si `ANTHROPIC_API_KEY` no está configurada, cada una de estas fallará de forma controlada (mensaje de error explicando el motivo) sin romper el resto de la app — el editor, el guardado en D1 y el PDF sin resumen ejecutivo siguen funcionando igual.

## 5. Dominio personalizado

En **Custom domains** del proyecto agrega, por ejemplo,
`parametrizador.gusgomez.design`. Si el dominio raíz ya vive en tu cuenta
de Cloudflare, el CNAME se crea solo.

## Cómo funciona el guardado en el frontend

`index.html` intenta primero `fetch('/api/projects', ...)`. Si la API no
responde (por ejemplo si abres el archivo localmente sin backend, o antes
de desplegarlo), cae automáticamente a `localStorage` del navegador para
que la app siga siendo utilizable sin romperse — verás un aviso "guardado
(local)" en vez de "guardado en la nube" en esos casos.

## Endpoints

| Método | Ruta                  | Qué hace                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | `/api/projects`       | Lista resumida (id, nombre, fecha, miniatura) |
| POST   | `/api/projects`       | Crea un proyecto nuevo                     |
| GET    | `/api/projects/:id`   | Trae el proyecto completo (incluye `state`) |
| PUT    | `/api/projects/:id`   | Actualiza nombre/estado de un proyecto     |
| DELETE | `/api/projects/:id`   | Borra un proyecto                          |

## Siguientes pasos posibles

- Autenticación (Cloudflare Access o un login simple) si más de una
  persona va a usar la herramienta y quieres separar proyectos por usuario.
- Guardar el plano de referencia subido en R2 en vez de como `dataURL`
  dentro del JSON de `state`, si empiezan a ser archivos pesados.
