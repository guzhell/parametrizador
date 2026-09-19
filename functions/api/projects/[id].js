// GET    /api/projects/:id  -> {id, name, updatedAt, thumb, state}  (state ya parseado)
// PUT    /api/projects/:id  -> actualiza, body: {name, thumb?, state}
// DELETE /api/projects/:id  -> borra el proyecto
//
// Requiere el mismo binding D1 "DB" que index.js.

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    const row = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(params.id).first();
    if (!row) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    return Response.json({
      id: row.id,
      name: row.name,
      updatedAt: row.updated_at,
      thumb: row.thumb,
      state: JSON.parse(row.state),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "db_error", detail: String(err) }), { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { env, params, request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }
  if (!body || !body.name || !body.state) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  const now = Date.now();
  const stateJSON = typeof body.state === "string" ? body.state : JSON.stringify(body.state);

  try {
    const result = await env.DB.prepare(
      "UPDATE projects SET name = ?, updated_at = ?, thumb = ?, state = ? WHERE id = ?"
    ).bind(body.name, now, body.thumb || null, stateJSON, params.id).run();

    if (result.meta.changes === 0) {
      // El proyecto no existía todavía: lo creamos con ese mismo id.
      await env.DB.prepare(
        "INSERT INTO projects (id, name, updated_at, thumb, state) VALUES (?, ?, ?, ?, ?)"
      ).bind(params.id, body.name, now, body.thumb || null, stateJSON).run();
    }
    return Response.json({ id: params.id, name: body.name, updatedAt: now });
  } catch (err) {
    return new Response(JSON.stringify({ error: "db_error", detail: String(err) }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(params.id).run();
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "db_error", detail: String(err) }), { status: 500 });
  }
}
