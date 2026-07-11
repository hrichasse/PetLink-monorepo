import { AppError, ERROR_CODES, HTTP_STATUS } from "@petlink/shared";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.0-flash";
const REQUEST_TIMEOUT_MS = 20_000;

export type ChatTurn = { role: "user" | "model"; text: string };

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
};

/**
 * Calls Google's Gemini generateContent endpoint server-side. The API key never
 * leaves the backend. `history` provides multi-turn context; the new question is
 * appended as the final user turn.
 */
export const generatePetAssistantReply = async (
  systemInstruction: string,
  history: ChatTurn[],
  question: string
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("El asistente no está configurado. Falta GEMINI_API_KEY.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR
    });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const contents = [
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: "user" as const, parts: [{ text: question }] }
  ];

  let response: Response;
  try {
    response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    throw new AppError("El asistente no está disponible en este momento. Intenta nuevamente.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR
    });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AppError("El asistente no pudo responder. Intenta nuevamente.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      details: process.env.NODE_ENV === "development" ? detail.slice(0, 500) : undefined
    });
  }

  const data = (await response.json().catch(() => null)) as GeminiResponse | null;
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    // Empty output usually means a safety block or an off-topic refusal upstream.
    throw new AppError("No pude generar una respuesta para esa consulta. Intenta reformularla.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }

  return text;
};
