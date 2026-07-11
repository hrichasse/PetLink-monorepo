import { AppError, ERROR_CODES, HTTP_STATUS } from "@petlink/shared";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 20_000;

export type ChatTurn = { role: "user" | "model"; text: string };

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

/**
 * Calls Groq's OpenAI-compatible chat completions endpoint server-side. The API
 * key never leaves the backend. History gives multi-turn context; the assistant
 * turns are mapped from our "model" role to OpenAI's "assistant" role.
 */
export const generatePetAssistantReply = async (
  systemInstruction: string,
  history: ChatTurn[],
  question: string
): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError("El asistente no está configurado. Falta GROQ_API_KEY.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR
    });
  }

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map((turn) => ({
      role: turn.role === "model" ? "assistant" : "user",
      content: turn.text
    })),
    { role: "user", content: question }
  ];

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 800 }),
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

  const data = (await response.json().catch(() => null)) as GroqResponse | null;
  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new AppError("No pude generar una respuesta para esa consulta. Intenta reformularla.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }

  return text;
};
