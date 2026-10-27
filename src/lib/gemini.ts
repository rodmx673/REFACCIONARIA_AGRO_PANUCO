// src/lib/gemini.ts
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-1.5-flash"; // Modelo real y rápido

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_TEXT_MODEL = "openai/gpt-oss-120b"; // Excelente para chat
const GROQ_VISION_MODEL = "qwen/qwen3.8-27b"; // Modelo con visión

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
  let geminiError: any = null;

  // ============ CASO 1: ES TEXTO (EL CHAT) ============
  if (!imagePart) {
    console.log("[AI] Solicitud de texto detectada. Usando Groq...");
    try {
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        model: GROQ_TEXT_MODEL,
        messages: [
          { role: "system", content: config?.systemInstruction || "Eres un asistente útil." },
          { role: "user", content: textPart?.text || "Hola" }
        ],
        temperature: 0.7,
      });
      const text = completion.choices?.[0]?.message?.content || "";
      if (text) return { text };
    } catch (err) {
      console.error("Groq falló en texto:", err);
      // Si Groq falla en texto, intentamos con Gemini de respaldo
    }
  }

  // ============ CASO 2: ES IMAGEN (FACTURAS) ============
  // Intentar con Gemini
  if (GEMINI_API_KEY.startsWith("AIzaSy")) {
    try {
      console.log("[AI] Intentando con Gemini Vision...");
      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config,
      });
      if (response.text) return { text: response.text };
    } catch (err: any) {
      geminiError = err;
      console.warn("Gemini falló:", err?.message);
    }
  }

  // Si falló Gemini o es imagen sin Gemini válido, intentamos Groq Vision
  if (imagePart && textPart && GROQ_API_KEY) {
    try {
      console.log("[AI] Intentando con Groq Vision...");
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
      if (text) return { text };
    } catch (groqErr: any) {
      console.error("Groq Vision falló:", groqErr?.message);
      throw new Error(`Ningún servicio respondió. Gemini: ${geminiError?.message} | Groq: ${groqErr?.message}`);
    }
  }

  throw new Error(geminiError?.message || "No se pudo procesar la solicitud con IA.");
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
