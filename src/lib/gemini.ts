// src/lib/gemini.ts
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

// ⚠️ SOLO PRUEBAS LOCALES — revocar keys después
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_VISION_MODEL = "gemini-3.8-flash";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
// Modelo de Groq CON visión (soporta image_url con base64)
const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

let cachedGemini: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!cachedGemini) cachedGemini = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return cachedGemini;
}

let cachedGroq: Groq | null = null;
function getGroq(): Groq {
  if (!cachedGroq) {
    cachedGroq = new Groq({
      apiKey: GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return cachedGroq;
}

export async function generateContentWithFallback(
  contents: any[],
  config?: any
): Promise<{ text: string }> {
  const imagePart = contents.find((p: any) => p.inlineData);
  const textPart = contents.find((p: any) => p.text);

  // ============ INTENTO 1: GEMINI con backoff ============
  const maxRetries = 2;
  let geminiError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Intento ${attempt}/${maxRetries}...`);
      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: GEMINI_VISION_MODEL,
        contents,
        config,
      });
      console.log("✅ Gemini respondió correctamente");
      return { text: response.text || "" };
    } catch (err: any) {
      geminiError = err;
      const status = err?.status || err?.error?.code;
      const msg = String(err?.message || "");
      console.warn(`⚠️ Gemini intento ${attempt} falló: ${status || msg.slice(0, 100)}`);

      if (
        (status === 503 || status === 429 || msg.includes("UNAVAILABLE")) &&
        attempt < maxRetries
      ) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.log(`   Reintentando en ${waitMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }
  }

  // ============ INTENTO 2: GROQ como FALLBACK ============
  if (imagePart && textPart && GROQ_API_KEY) {
    try {
      console.log("🔁 Gemini agotado. Probando Groq Vision...");
      const groq = getGroq();

      const completion = await groq.chat.completions.create({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: textPart.text },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      });

      const text = completion.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Groq devolvió respuesta vacía");
      console.log("✅ Groq respondió correctamente");
      return { text };
    } catch (groqErr: any) {
      console.error("❌ Groq también falló:", groqErr?.message || groqErr);
      throw new Error(
        `Ningún servicio de IA respondió.\n` +
          `Gemini: ${geminiError?.message?.slice(0, 150)}\n` +
          `Groq: ${groqErr?.message?.slice(0, 150)}`
      );
    }
  }

  // Sin imagen → no intentar Groq Vision
  throw new Error(geminiError?.message || "Gemini falló y no hay imagen para Groq");
}

export function parseJsonFromMarkdown(text: string): any {
  if (!text) return {};
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (m?.[1]) { try { return JSON.parse(m[1]); } catch {} }
  const i = text.indexOf("{");
  const j = text.lastIndexOf("}");
  if (i !== -1 && j > i) {
    try { return JSON.parse(text.slice(i, j + 1)); } catch {}
  }
  return {};
}
