// POST /api/ai/suggest-layout
// Body: { businessType: string, areaM2: number }
// Respuesta: { items: [{catKey, count, zone}], note: string }

import { catalogPromptBlock } from "../../_shared/catalog.js";
import { callClaude, parseJSONLoose } from "../../_shared/anthropic.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  const { businessType, areaM2 } = body;
  if (!businessType || !areaM2) {
    return new Response(JSON.stringify({ error: "missing_fields", detail: "Se requieren 'businessType' y 'areaM2'." }), { status: 400 });
  }

  const system = `Eres un consultor de layout retail. Catálogo disponible (usa el "key" EXACTO):
${catalogPromptBlock()}

Zonas válidas: entrance, back, left, right, center, near_counter.

Dado un giro de negocio y un área en m², propone una mezcla inicial razonable de elementos, pensando en categorías típicas de ese giro y en dejar espacio de circulación (no lo satures). Responde ÚNICAMENTE con JSON válido (sin texto adicional, sin \`\`\`), con esta forma exacta:
{"items":[{"catKey":"mostrador","count":1,"zone":"near_counter"}, {"catKey":"rack_abarrotes","count":4,"zone":"back"}],
 "note":"1-2 frases explicando la lógica de la propuesta"}

Regla aproximada de densidad: no más de 1 elemento de mobiliario/rack por cada 2.5 m² de área total (para dejar espacio de circulación).`;

  const userText = `Giro de negocio: ${businessType}\nÁrea disponible: ${areaM2} m²`;

  try {
    const text = await callClaude(env, { system, userText, maxTokens: 1200 });
    const json = parseJSONLoose(text);
    if (!json.items || !Array.isArray(json.items)) throw new Error("respuesta con forma inesperada");
    return Response.json(json);
  } catch (err) {
    return new Response(JSON.stringify({ error: "ai_error", detail: String(err) }), { status: 500 });
  }
}
