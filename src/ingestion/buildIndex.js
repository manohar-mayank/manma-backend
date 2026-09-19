import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const dataDirectory = path.resolve("src/data");
async function readMarkdown(directory) { const entries = await readdir(directory, { withFileTypes: true }); const nested = await Promise.all(entries.flatMap((entry) => entry.isDirectory() ? readMarkdown(path.join(directory, entry.name)) : entry.name.endsWith(".md") ? [path.join(directory, entry.name)] : [])); return nested.flat(); }
const files = await readMarkdown(dataDirectory);
const documents = await Promise.all(files.map(async (file) => { const relative = path.relative(dataDirectory, file).replaceAll("\\", "/"); const isProject = relative.startsWith("projects/"); const name = path.basename(file, ".md"); return new Document({ pageContent: await readFile(file, "utf8"), metadata: { source: relative, title: name.replaceAll("-", " "), type: isProject ? "project" : "knowledge", project: isProject ? name : undefined } }); }));
const chunks = await new RecursiveCharacterTextSplitter({ chunkSize: 900, chunkOverlap: 150 }).splitDocuments(documents);
const embeddings = new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-001" });
await QdrantVectorStore.fromDocuments(chunks, embeddings, { url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY, collectionName: process.env.QDRANT_COLLECTION || "manma-ai-portfolio" });
console.info(`Indexed ${chunks.length} chunks from ${files.length} portfolio files.`);
