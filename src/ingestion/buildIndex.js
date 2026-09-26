import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";

const dataDirectory = path.resolve("src/data");
async function readSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.flatMap((entry) =>
      entry.isDirectory()
        ? readSourceFiles(path.join(directory, entry.name))
        : /\.(md|pdf)$/i.test(entry.name)
          ? [path.join(directory, entry.name)]
          : [],
    ),
  );
  return nested.flat();
}
async function readPdfText(file) {
  const parser = new PDFParse({ data: await readFile(file) });
  try {
    const result = await parser.getText();
    if (!result.text.trim()) {
      throw new Error(`No extractable text found in PDF: ${file}`);
    }
    return result.text;
  } finally {
    await parser.destroy();
  }
}

const files = await readSourceFiles(dataDirectory);
const documents = await Promise.all(files.map(async (file) => {
    const relative = path.relative(dataDirectory, file).replaceAll("\\", "/");
    const isProject = relative.startsWith("projects/");
    const extension = path.extname(file).toLowerCase();
    const name = path.basename(file, extension);
    const pageContent =
      extension === ".pdf"
        ? await readPdfText(file)
        : await readFile(file, "utf8");
    return new Document({
      pageContent,
      metadata: {
        source: relative,
        title: name.replaceAll("-", " "),
        type: isProject ? "project" : "knowledge",
        project: isProject ? name : undefined,
      },
    });
  }));
const chunks = await new RecursiveCharacterTextSplitter({
  chunkSize: 900,
  chunkOverlap: 150,
}).splitDocuments(documents);
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});
await QdrantVectorStore.fromDocuments(chunks, embeddings, {
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  collectionName: process.env.QDRANT_COLLECTION || "manma-ai-portfolio",
});
console.info(
  `Indexed ${chunks.length} chunks from ${documents.length} portfolio files.`,
);
