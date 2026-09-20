// POST /api/ai/layout-assistant
// Body: { instruction: string, state: { areaM2, itemCounts:[{name,count}], aisleCount } }
// Respuesta: { actions: [ {type:'add'|'remove_type'|'clear_all_items'|'note', ...} ] }
//
// El frontend interpreta y aplica estas acciones sobre el plano (index.html,
// función applyAIActions). Esta función NO conoce coordenadas exactas del
// plano del usuario — solo "zonas" relativas (entrance/back/left/right/
// center/near_counter) que el frontend traduce a metros según el contorno
// trazado.

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

  const instruction = (body.instruction || "").trim();
  if (!instruction) {
    return new Response(JSON.stringify({ error: "missing_instruction" }), { status: 400 });
  }
  const state = body.state || {};

  const summary = [
    `Área del local: ${state.areaM2 ? state.areaM2.toFixed(1) + " m²" : "sin contorno trazado todavía"}`,
    `Elementos ya colocados: ${(state.itemCounts || []).map((c) => `${c.count}x ${c.name}`).join(", ") || "ninguno"}`,
    `Pasillos definidos: ${state.aisleCount || 0}`,
  ].join("\n");

  const system = `Eres un asistente que modifica el layout de una tienda retail dentro de un editor visual. SOLO puedes usar estos elementos del catálogo (usa el "key" EXACTO tal cual aparece, sin inventar otros):
${catalogPromptBlock()}

Zonas válidas para colocar elementos (relativas al contorno del local, no coordenadas exactas): entrance, back, left, right, center, near_counter.

Responde ÚNICAMENTE con JSON válido (sin texto adicional, sin \`\`\`), con esta forma exacta:
{"actions":[
  {"type":"add","catKey":"rack_abarrotes","count":3,"zone":"entrance","rot":0},
  {"type":"remove_type","catKey":"silla","count":2},
  {"type":"clear_all_items"},
  {"type":"note","text":"mensaje breve para el usuario"}
]}

Reglas:
- Usa "remove_type" para quitar elementos existentes por tipo (no conoces sus IDs individuales).
- Usa "clear_all_items" solo si el usuario pide vaciar/reiniciar el mobiliario.
- Siempre incluye al final una acción "note" con 1-2 frases explicando qué hiciste (o por qué no se pudo, si la instrucción no calza con el catálogo disponible).
- No agregues elementos que no estén en el catálogo.`;

  const userText = `Estado actual del local:\n${summary}\n\nInstrucción del usuario: "${instruction}"`;

  try {
    const text = await callClaude(env, { system, userText, maxTokens: 1200 });
    const json = parseJSONLoose(text);
    if (!json.actions || !Array.isArray(json.actions)) throw new Error("respuesta con forma inesperada");
    return Response.json(json);
  } catch (err) {
    return new Response(JSON.stringify({ error: "ai_error", detail: String(err) }), { status: 500 });
  }
}
