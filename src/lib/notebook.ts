// Notebook (Phase 3 extension): an LLM chat grounded in a topic's study notes.
// The model is asked to answer ONLY from the provided material, so it never
// fabricates facts the syllabus notes don't support.

import type { StudyNote } from "@prisma/client";
import {
  AiNotConfiguredError,
  aiStatus,
  chatWithOpenRouter,
  generateWithGemini,
} from "@/lib/ai";

export const NOTEBOOK_MODEL = "meta-llama/llama-3.3-70b-instruct";

/** Builds a grounded system prompt from the topic's study notes. Pure. */
export function buildNotebookPrompt(
  topicName: string,
  notes: Pick<StudyNote, "title" | "body">[],
  message: string
): string {
  const material =
    notes.length === 0
      ? "(no study material available for this topic)"
      : notes
          .map((n) => `— ${n.title || "Note"}\n${n.body}`)
          .join("\n\n");

  return [
    "You are the study companion in MCQure, a competitive-exam prep app.",
    `Topic: ${topicName}`,
    "Rule: answer the student using ONLY the study material below. Quote or paraphrase it faithfully. If the material does not cover the question, say so plainly and suggest the student read the attached sources — do not invent content.",
    "Keep answers concise and exam-focused. Use short bullet points when helpful.",
    "=== STUDY MATERIAL ===\n" + material,
    "=== STUDENT QUESTION ===\n" + message,
  ].join("\n\n");
}

export interface NotebookAnswer {
  answer: string;
  provider: string;
}

/**
 * Produces an answer for one student message. Prefers OpenRouter (chat) and
 * falls back to Gemini (single-turn). Throws AiNotConfiguredError when no AI
 * provider has a real key.
 */
export async function answerNotebook(
  topicName: string,
  notes: Pick<StudyNote, "title" | "body">[],
  message: string
): Promise<NotebookAnswer> {
  const prompt = buildNotebookPrompt(topicName, notes, message);
  const status = aiStatus();

  if (status.openRouter) {
    const res = await chatWithOpenRouter({
      model: NOTEBOOK_MODEL,
      messages: [
        { role: "system", content: "You are a focused study companion." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });
    return { answer: res.text.trim(), provider: "openrouter" };
  }

  if (status.gemini) {
    const res = await generateWithGemini({
      prompt,
      temperature: 0.3,
      maxOutputTokens: 1024,
    });
    return { answer: res.text.trim(), provider: "gemini" };
  }

  throw new AiNotConfiguredError("openRouter", "OPENROUTER_API_KEY");
}
