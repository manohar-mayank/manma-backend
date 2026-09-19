import { generateAnswer } from "./llm.service.js";
import { retrievePortfolioContext } from "./retrieval.service.js";
const fallback =
  "I can help with Mayank's portfolio, projects, skills, experience, and technical background. I don't have information about that topic.";
export async function answerPortfolioQuestion({ message, conversation }) {
  const matches = await retrievePortfolioContext(message);
  if (!matches.length) return { answer: fallback, sources: [], projects: [] };
  const answer = await generateAnswer({
    message,
    conversation,
    context: matches.map((match) => match.content).join("\n\n"),
  });
  const sources = matches.map((match) => ({
    title:
      match.metadata.title || match.metadata.source || "Portfolio knowledge",
    type: match.metadata.type || "portfolio",
    source: match.metadata.source || null,
  }));
  const projects = [
    ...new Set(matches.map((match) => match.metadata.project).filter(Boolean)),
  ];
  return { answer, sources, projects };
}
