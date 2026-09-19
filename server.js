import "dotenv/config";
import cors from "cors";
import express from "express";
import { manmaRouter } from "./src/routes/manma.routes.js";

const app = express();
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
).split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "16kb" }));
app.get("/health", (_request, response) =>
  response.json({ ok: true, service: "manma" }),
);
app.use("/manma", manmaRouter);
app.use((error, _request, response, _next) => {
  console.error("Unhandled Manma error", error);
  response
    .status(500)
    .json({
      ok: false,
      answer: "Manma is temporarily unavailable. Please try again shortly.",
      sources: [],
      projects: [],
    });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () =>
  console.info(`Manma API listening on port ${port}`),
);
