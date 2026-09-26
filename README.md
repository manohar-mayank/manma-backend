# Manma Backend

Manma is the Express API that powers the portfolio's AI guide. It answers questions about Mayank's portfolio using retrieved project and knowledge documents as context for Gemini.

## Tech Stack

- Node.js and Express
- LangChain core, Google GenAI, Qdrant, and text splitters
- Gemini for embeddings and answer generation
- Qdrant Cloud or another Qdrant-compatible deployment for vector search
- dotenv, CORS, and request validation/rate limiting

## Architecture

```text
Frontend ManmaDrawer
  -> POST /manma
  -> validation and rate limit middleware
  -> RAG service
  -> Qdrant retrieval with Gemini embeddings
  -> LangChain Gemini chat model
  -> JSON response
```

## RAG Flow

1. The frontend sends a message and up to eight conversation messages.
2. The route validates the request and applies the in-memory rate limit.
3. The retrieval service embeds the query and searches the configured Qdrant collection.
4. Results below `RELEVANCE_THRESHOLD` are discarded.
5. The RAG service builds a context string and passes it to the prompt and Gemini model.
6. The controller returns the existing answer, source, and project fields.

## Gemini and LangChain

`@langchain/google-genai` provides both `GoogleGenerativeAIEmbeddings` for retrieval and `ChatGoogleGenerativeAI` for answer generation. LangChain message types preserve the system prompt, conversation context, and current user message.

## Embeddings and Qdrant

The index builder uses the `gemini-embedding-001` embedding model and writes split documents to the configured Qdrant collection. The API reads the existing collection and uses the same embedding model for similarity search. `QDRANT_API_KEY` is passed to both indexing and retrieval clients when configured.

## Knowledge and Data

```text
src/data/
  knowledge/             General portfolio Markdown and PDF documents
  projects/              Project-specific Markdown and PDF documents
  manma-questions.json   Manual question coverage/reference list
```

The ingestion workflow reads `.md` and `.pdf` files recursively from `src/data`. PDFs are converted to text with `pdf-parse`; extracted text and Markdown are split into chunks, tagged with source metadata, embedded with Gemini, and written to Qdrant. PDFs must contain extractable text; scanned image-only PDFs need OCR before indexing. `manma-questions.json` is a manual question reference and is not part of the index.

## Environment Variables

Copy `.env.example` to `.env` and provide real values locally or in the deployment platform:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_API_KEY=replace_me
QDRANT_URL=https://your-qdrant-instance
QDRANT_API_KEY=replace_me
QDRANT_COLLECTION=manma-ai-portfolio
RELEVANCE_THRESHOLD=0.45
GEMINI_MODEL=gemini-2.5-flash
```

`GOOGLE_API_KEY` is used by the Gemini LangChain integration. `CLIENT_ORIGIN` accepts a comma-separated list of allowed frontend origins. Never commit `.env` or place real credentials in `.env.example`.

## Installation

```bash
cd Manma-Backend
npm install
```

## Running Locally

Start the API:

```bash
npm start
```

For automatic restart during development:

```bash
npm run dev
```

Build or refresh the Qdrant index after configuring credentials:

```bash
npm run index
```

Place PDF or Markdown knowledge files under `src/data/knowledge` (or project-specific files under `src/data/projects`) before running the index command. There is no HTTP file-upload endpoint; indexing is performed by this command.

The server exposes `GET /health` for a basic health check.

## API Endpoint

### `POST /manma`

Request:

```json
{
  "message": "Who is Mayank?",
  "conversation": []
}
```

Successful response shape:

```json
{
  "ok": true,
  "answer": "Mayank is ...",
  "sources": [
    {
      "title": "about",
      "type": "knowledge",
      "source": "knowledge/about.md"
    }
  ],
  "projects": []
}
```

The exact generated answer and sources depend on the indexed documents and Gemini response. Invalid input returns a 400 response; unavailable model or vector services return the existing 503 response shape.

## Deployment Notes

- Set `PORT` from the deployment platform when available.
- The server listens on `0.0.0.0` for container and hosted deployments.
- Set `CLIENT_ORIGIN` to the deployed frontend origin, or a comma-separated set of trusted origins.
- Ensure the target Qdrant collection has been built with `npm run index` before serving questions.
- Keep Gemini and Qdrant credentials in the platform's secret environment settings.
- Allow outbound network access to Gemini and Qdrant.

## Security Notes

- Do not commit `.env`, API keys, Qdrant URLs containing credentials, or logs with sensitive data.
- Keep `CLIENT_ORIGIN` limited to trusted frontend origins.
- The API validates message length and conversation roles and applies a basic per-IP rate limit.
- Treat retrieved documents as untrusted reference context; the system prompt constrains Manma to portfolio topics.
