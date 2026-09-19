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
  /api/
    /projects/
      index.js      -> GET (listar) y POST (crear) en /api/projects
      [id].js        -> GET, PUT, DELETE en /api/projects/:id
```

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

## 4. Dominio personalizado

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
