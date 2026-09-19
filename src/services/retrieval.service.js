import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
const threshold = Number(process.env.RELEVANCE_THRESHOLD || 0.45);
let vectorStore;
async function getVectorStore() {
  if (!vectorStore) {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-001",
    });
    vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION || "manma-ai-portfolio",
    });
  }
  return vectorStore;
}
export async function retrievePortfolioContext(query) {
  const store = await getVectorStore();
  const results = await store.similaritySearchWithScore(query, 5);
  return results
    .filter(([, score]) => score >= threshold)
    .map(([document, score]) => ({
      content: document.pageContent,
      score,
      metadata: document.metadata || {},
    }));
}
