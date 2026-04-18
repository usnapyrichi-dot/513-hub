"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Shared Gemini helper ─────────────────────────────────────────────────────

async function callGemini(
  prompt: string,
  temperature = 0.7,
  maxTokens = 8192,
  systemInstruction?: string   // ← Gem instructions go here
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No hay API Key de Gemini configurada.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };

  // Inject Gem system instruction if provided
  // This is exactly how Google AI Studio Gems work internally
  if (systemInstruction?.trim()) {
    body.system_instruction = {
      parts: [{ text: systemInstruction.trim() }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini no devolvió resultado válido.");
  return text;
}

// ─── Fetch client context helper ──────────────────────────────────────────────

async function getClientContext(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("name, brand_guidelines")
    .eq("id", clientId)
    .single();
  return data;
}

// ─── 1. Generate Ideation Concepts (existing, refactored) ─────────────────────

export async function generateContentIdeas(clientId: string, prompt: string, gemInstruction?: string) {
  try {
    const client = await getClientContext(clientId);
    if (!client) throw new Error("Cliente no encontrado.");

    const tone = client.brand_guidelines?.tone ?? "premium, directo, autoridad";

    const fullPrompt = `
Eres el Copiloto Creativo Senior de "513 HUB", agencia de publicidad automotriz premium.
Tu misión: generar EXACTAMENTE 3 conceptos visuales/copy para redes sociales.

Marca: ${client.name}
Tono de marca: ${tone}
Brief del usuario: "${prompt}"

Formato obligatorio:
- Separa cada idea con "---IDEA---"
- Cada idea empieza con [HOOK VISUAL o AUDIO CUE]
- 2-3 líneas describiendo la ejecución visual del vídeo/carrusel
- Sin introducciones. Directo a las ideas.
`;
    const resultText = await callGemini(fullPrompt, 0.8, 8192, gemInstruction);
    const ideas = resultText
      .split("---IDEA---")
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);

    return { success: true, ideas };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── 2. Generate On-Brand Copy ────────────────────────────────────────────────

export async function generateCopy(
  clientId: string,
  brief: string,
  platform: string,
  contentType: string,
  gemInstruction?: string
) {
  try {
    const client = await getClientContext(clientId);
    if (!client) throw new Error("Cliente no encontrado.");

    const guidelines = client.brand_guidelines;
    const tone = guidelines?.tone ?? "premium, directo, aspiracional";
    const dos = guidelines?.dos?.join(", ") ?? "";
    const donts = guidelines?.donts?.join(", ") ?? "";

    const fullPrompt = `
Eres el copywriter senior de "513 HUB", especialista en marcas automotrices premium.
Escribe copy de redes sociales para la siguiente pieza.

MARCA: ${client.name}
PLATAFORMA: ${platform}
TIPO DE CONTENIDO: ${contentType}
BRIEF: ${brief}
TONO DE MARCA: ${tone}
${dos ? `QUÉ SÍ HACER: ${dos}` : ""}
${donts ? `QUÉ EVITAR: ${donts}` : ""}

Devuelve EXACTAMENTE este formato, sin explicaciones adicionales:

HOOK:
[1 frase de impacto, máx 10 palabras]

CUERPO:
[2-3 frases que desarrollan el mensaje]

CTA:
[Llamada a la acción clara, máx 8 palabras]

HASHTAGS:
[5-8 hashtags relevantes separados por espacios]
`;
    const resultText = await callGemini(fullPrompt, 0.75, 8192, gemInstruction);
    return { success: true, copy: resultText };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── 3. Generate Video Prompt (Higgsfield / Veo / Kling) ─────────────────────

export async function generateVideoPrompt(
  clientId: string,
  concept: string,
  style: string,
  gemInstruction?: string
) {
  try {
    const client = await getClientContext(clientId);
    if (!client) throw new Error("Cliente no encontrado.");

    const tone = client.brand_guidelines?.tone ?? "premium, cinematográfico";

    const fullPrompt = `
Eres un director de arte especializado en publicidad automotriz para vídeo generativo IA (Higgsfield, Veo 3, Kling).
Escribe un prompt cinematográfico de alta precisión para generar el siguiente vídeo.

MARCA: ${client.name}
CONCEPTO: ${concept}
ESTILO VISUAL: ${style}
TONO: ${tone}

Devuelve EXACTAMENTE este formato:

ESCENA:
[Descripción de la acción y el sujeto principal, 1-2 frases]

CÁMARA:
[Tipo de plano + movimiento de cámara. Ej: "Extreme close-up del capó, slow dolly-in"]

ILUMINACIÓN:
[Descripción de luz y atmósfera. Ej: "Golden hour lateral, sombras duras, rim light azul"]

AMBIENTE:
[Entorno y contexto. Ej: "Carretera costera vacía, atardecer, niebla ligera"]

ESTILO:
[Referencia visual. Ej: "Hiperrealista, 8K, acabado cinematográfico tipo anuncio BMW"]

PROMPT FINAL:
[Todo en una sola línea en inglés, optimizado para Higgsfield/Veo/Kling, máx 200 palabras]
`;
    const resultText = await callGemini(fullPrompt, 0.8, 8192, gemInstruction);
    return { success: true, prompt: resultText };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── 4. Save prompt to library ────────────────────────────────────────────────

export async function saveAiPrompt(data: {
  content_piece_id?: string;
  prompt_type: "copy" | "image_prompt" | "video_prompt" | "briefing";
  provider: "gemini" | "higgsfield";
  prompt: string;
  result_text: string;
  parameters?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error, data: saved } = await supabase
    .from("ai_prompts")
    .insert({ ...data, is_favorite: false })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/ai-studio");
  return { success: true, prompt: saved };
}

// ─── 5. Toggle favorite ───────────────────────────────────────────────────────

export async function togglePromptFavorite(id: string, isFavorite: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_prompts")
    .update({ is_favorite: isFavorite })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/ai-studio");
  return { success: true };
}

// ─── 6. Delete prompt ─────────────────────────────────────────────────────────

export async function deleteAiPrompt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_prompts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/ai-studio");
  return { success: true };
}
