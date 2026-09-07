import express from "express";
import auth from "../middleware/auth.js";
import { createAnalysis, deleteAnalysis, getAnalyses, getAnalysisById } from "../controllers/analysisController.js";

const analysisRouter = express.Router();

analysisRouter.post("/", auth, createAnalysis);
analysisRouter.get("/", auth, getAnalyses);
analysisRouter.get("/:id", auth, getAnalysisById);
analysisRouter.delete("/:id", auth, deleteAnalysis);

export default analysisRouter;