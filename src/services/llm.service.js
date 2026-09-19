import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MANMA_SYSTEM_PROMPT } from "../prompts/manma.prompt.js";
let llm;
function getLlm() {
  if (!llm)
    llm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      temperature: 0.5,
    });
  return llm;
}
export async function generateAnswer({ message, conversation, context }) {
  const history = conversation.map(
    (item) => new HumanMessage(`${item.role}: ${item.content}`),
  );
  const response = await getLlm().invoke([
    new SystemMessage(
      `${MANMA_SYSTEM_PROMPT}\n\nPortfolio context:\n${context}`,
    ),
    ...history,
    new HumanMessage(message),
  ]);
  return typeof response.content === "string"
    ? response.content
    : String(response.content);
}
