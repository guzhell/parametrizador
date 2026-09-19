// GET  /api/projects        -> lista resumida [{id, name, updatedAt, thumb}, ...]
// POST /api/projects        -> crea un proyecto nuevo, body: {id?, name, thumb?, state}
//
// Requiere un binding D1 llamado "DB" en la configuración del proyecto de
// Cloudflare Pages (Settings → Functions → D1 database bindings).

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name, updated_at as updatedAt, thumb FROM projects ORDER BY updated_at DESC"
    ).all();
    return Response.json(results);
  } catch (err) {
    return new Response(JSON.stringify({ error: "db_error", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }
  if (!body || !body.name || !body.state) {
    return new Response(JSON.stringify({ error: "missing_fields", detail: "Se requieren 'name' y 'state'." }), { status: 400 });
  }

  const id = body.id || ("p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8));
  const now = Date.now();
  const stateJSON = typeof body.state === "string" ? body.state : JSON.stringify(body.state);

  try {
    await env.DB.prepare(
      `INSERT INTO projects (id, name, updated_at, thumb, state) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         updated_at = excluded.updated_at,
         thumb = excluded.thumb,
         state = excluded.state`
    ).bind(id, body.name, now, body.thumb || null, stateJSON).run();

    return Response.json({ id, name: body.name, updatedAt: now });
  } catch (err) {
    return new Response(JSON.stringify({ error: "db_error", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
