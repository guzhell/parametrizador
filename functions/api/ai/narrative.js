// POST /api/ai/narrative
// Body: { kind: "compliance" | "pdf_summary", payload: {...} }
// Respuesta: { text: string }
//
// Usada por dos features:
//  - "Validar normativa" (kind=compliance): redacta una recomendación breve
//    a partir de los hallazgos de la revisión de circulación, que se calcula
//    de forma determinista en el frontend (no requiere IA, solo reglas).
//  - Resumen ejecutivo del PDF (kind=pdf_summary): un párrafo que se inserta
//    al inicio del PDF exportado.

import { callClaude } from "../../_shared/anthropic.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  const kind = body.kind;
  const payload = body.payload || {};
  let system, userText;

  if (kind === "compliance") {
    system = `Eres un asesor de diseño de espacios comerciales. Vas a recibir hallazgos de una revisión automática de circulación en una tienda (advertencias y aciertos, calculados por reglas simples, no por ti). Escribe un párrafo breve (3 a 5 oraciones), en español, con tono práctico y directo, priorizando qué corregir primero. Sintetiza, no repitas cada hallazgo literal. Aclara que es una revisión orientativa y no sustituye el dictamen de un arquitecto certificado ni de Protección Civil local. Responde solo con el texto del párrafo, sin JSON ni markdown.`;
    userText = `Área del local: ${payload.area ?? "desconocida"} m²
Advertencias:
${(payload.warnings || []).map((w) => "- " + w).join("\n") || "(ninguna)"}
Aciertos:
${(payload.passes || []).map((p) => "- " + p).join("\n") || "(ninguno)"}`;
  } else if (kind === "pdf_summary") {
    system = `Eres un consultor de retail redactando el resumen ejecutivo de un reporte de layout de tienda. Escribe un párrafo breve (3 a 5 oraciones), en español, tono profesional, resumiendo el proyecto y destacando 1-2 observaciones útiles (ej. proporción del presupuesto entre obra/mobiliario/racks, o densidad de elementos por m²). No inventes cifras que no te den. Responde solo con el texto del párrafo, sin JSON ni markdown.`;
    const c = payload.costs || {};
    userText = `Área: ${payload.area ?? "desconocida"} m²
Costos: obra $${c.sumObra ?? 0}, mobiliario $${c.sumMob ?? 0}, racks $${c.sumRack ?? 0}, servicios $${c.sumServ ?? 0}, total estimado $${c.total ?? 0}
Elementos colocados: ${(payload.itemCounts || []).map((x) => `${x.count}x ${x.name}`).join(", ") || "ninguno"}
Pasillos definidos: ${payload.aisleCount || 0}`;
  } else {
    return new Response(JSON.stringify({ error: "invalid_kind" }), { status: 400 });
  }

  try {
    const text = await callClaude(env, { system, userText, maxTokens: 500 });
    return Response.json({ text: text.trim() });
  } catch (err) {
    return new Response(JSON.stringify({ error: "ai_error", detail: String(err) }), { status: 500 });
  }
}
