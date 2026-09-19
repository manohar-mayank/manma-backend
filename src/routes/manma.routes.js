import { Router } from "express";
import { chatWithManma } from "../controllers/manma.controller.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateChatRequest } from "../middleware/validate.js";
export const manmaRouter = Router();
manmaRouter.post("/", rateLimit, validateChatRequest, chatWithManma);
