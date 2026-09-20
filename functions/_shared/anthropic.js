// Helper compartido para llamar a la API de Anthropic desde Cloudflare Pages
// Functions. Requiere la variable de entorno/secreto ANTHROPIC_API_KEY
// configurada en el proyecto de Pages (Settings → Environment variables).
//
// IMPORTANTE: esta clave NUNCA se expone al navegador — solo vive en el
// entorno de la Function, que corre en el servidor de Cloudflare.

export async function callClaude(env, { system, userText, maxTokens = 1200, model, imageBase64, imageMediaType }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("missing_api_key: agrega ANTHROPIC_API_KEY en las variables de entorno del proyecto de Pages");
  }

  const content = [];
  if (imageBase64) {
    content.push({ type: "image", source: { type: "base64", media_type: imageMediaType || "image/png", data: imageBase64 } });
  }
  content.push({ type: "text", text: userText });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`anthropic_http_${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return text;
}

// Los modelos a veces envuelven el JSON en ```json ... ``` o agregan texto
// alrededor a pesar de que se les pide no hacerlo — esto lo tolera.
export function parseJSONLoose(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  let start = firstObj;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) start = firstArr;
  const jsonSlice = start >= 0 ? cleaned.slice(start) : cleaned;
  return JSON.parse(jsonSlice);
}
