import express from "express";
import { createKeyword, getKeywords, getKeywordById, getKeywordRankHistory, updateKeyword, deleteKeyword, toggleKeywordActiveStatus, updateKeywordrank, checkKeywordRankForTracking } from "../controllers/keywordTrackingController.js";
import auth from "../middleware/auth.js";

const keywordRouter = express.Router();

keywordRouter.post("/", auth, createKeyword);
keywordRouter.get("/", auth, getKeywords);
keywordRouter.get("/:id/history", auth, getKeywordRankHistory);
keywordRouter.get("/:id", auth, getKeywordById);
keywordRouter.put("/:id", auth, updateKeyword);
keywordRouter.delete("/:id", auth, deleteKeyword);
keywordRouter.patch("/:id/active", auth, toggleKeywordActiveStatus);
keywordRouter.patch("/:id/rank", auth, updateKeywordrank);
keywordRouter.post("/:id/check", auth, checkKeywordRankForTracking);
export default keywordRouter;
