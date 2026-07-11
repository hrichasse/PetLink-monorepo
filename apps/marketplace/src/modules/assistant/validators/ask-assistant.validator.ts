import { z } from "zod";

const chatTurnSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().trim().min(1).max(4000)
});

export const askAssistantSchema = z
  .object({
    question: z.string().trim().min(3).max(1000),
    // Recent conversation turns for multi-turn context (capped to bound tokens).
    history: z.array(chatTurnSchema).max(10).optional().default([])
  })
  .strict();

export type AskAssistantInput = z.infer<typeof askAssistantSchema>;
