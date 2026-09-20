// POST /api/ai/detect-walls
// Body: { imageBase64: string (sin el prefijo "data:..."), mediaType: "image/png"|"image/jpeg" }
// Respuesta: { polygon: [[x,y], ...] }  -- coordenadas normalizadas 0..1
//            respecto al ancho/alto de la imagen subida.
//
// El frontend convierte esas coordenadas normalizadas a metros usando el
// tamaño de la imagen y la escala del plano ya definida en el editor.

import { callClaude, parseJSONLoose } from "../../_shared/anthropic.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  const { imageBase64, mediaType } = body;
  if (!imageBase64) {
    return new Response(JSON.stringify({ error: "missing_image" }), { status: 400 });
  }

  const system = `Eres un asistente que analiza planos, croquis o fotos de plantas arquitectónicas de locales comerciales. Vas a recibir una imagen. Identifica el CONTORNO EXTERIOR del local (el perímetro del espacio, ignorando muebles, texto, acotaciones o muros interiores) y responde ÚNICAMENTE con JSON válido, sin texto adicional y sin \`\`\`, con esta forma exacta:
{"polygon":[[x1,y1],[x2,y2],[x3,y3],[x4,y4]]}

Donde cada [x,y] son coordenadas normalizadas entre 0 y 1 respecto al ancho y alto de la imagen (0,0 = esquina superior izquierda de la imagen; 1,1 = esquina inferior derecha). Ordena los puntos de forma consistente alrededor del contorno (sin cruces). Usa entre 4 y 14 puntos — los mínimos necesarios para representar el contorno con fidelidad razonable.

Si la imagen no muestra un plano identificable o no puedes trazar un contorno con confianza razonable, responde exactamente: {"polygon":[], "note":"explicación breve de por qué no se pudo"}`;

  try {
    const text = await callClaude(env, {
      system,
      userText: "Analiza esta imagen y extrae el contorno exterior del local en el formato pedido.",
      imageBase64,
      imageMediaType: mediaType || "image/png",
      maxTokens: 800,
    });
    const json = parseJSONLoose(text);
    return Response.json(json);
  } catch (err) {
    return new Response(JSON.stringify({ error: "ai_error", detail: String(err) }), { status: 500 });
  }
}
