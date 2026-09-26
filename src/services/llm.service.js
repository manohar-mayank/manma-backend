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
function createMessages({ message, conversation, context }) {
  const history = conversation.map(
    (item) => new HumanMessage(`${item.role}: ${item.content}`),
  );
  return [
    new SystemMessage(
      `${MANMA_SYSTEM_PROMPT}\n\nPortfolio context:\n${context}`,
    ),
    ...history,
    new HumanMessage(message),
  ];
}

function getText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}

export async function generateAnswer(input) {
  const response = await getLlm().invoke(createMessages(input));
  return getText(response.content);
}
