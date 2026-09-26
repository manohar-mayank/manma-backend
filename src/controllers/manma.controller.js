import { answerPortfolioQuestion } from "../services/rag.service.js";

export async function chatWithManma(request, response) {
  const startedAt = Date.now();
  try {
    const result = await answerPortfolioQuestion(request.chat);
    console.info("Manma request", {
      chars: request.chat.message.length,
      sources: result.sources.length,
      durationMs: Date.now() - startedAt,
    });
    return response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Manma request failed", {
      message: error.message,
      durationMs: Date.now() - startedAt,
    });
    return response
      .status(503)
      .json({
        ok: false,
        answer: "Manma is unavailable right now. Please try again later.",
        sources: [],
        projects: [],
      });
  }
}
