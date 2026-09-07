import Analysis from "../models/Analysis.js";
import User from "../models/User.js";
import { analyzeWebsite } from "../services/websiteAnalyzer.js";

export const createAnalysis = async (req, res) => {
    try {
        const { url: inputUrl } = req.body;

        if (!inputUrl?.trim()) {
            return res.status(400).json({ message: "A website URL is required." });
        }

        let result;
        try {
            result = await analyzeWebsite(inputUrl);
        } catch (error) {
            return res.status(422).json({ message: error.name === "AbortError" ? "The website took too long to respond." : error.message || "Unable to analyze this website." });
        }

        const analysis = await Analysis.create({ user: req.userId, ...result });
        await User.findByIdAndUpdate(req.userId, {
            $inc: { analysisCount: 1 },
            $set: { lastAnalysisDate: new Date() },
        });

        return res.status(201).json({ analysis });
    } catch (error) {
        console.error("Error creating analysis:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAnalysisById = async (req, res) => {
    try {
        const analysis = await Analysis.findOne({ _id: req.params.id, user: req.userId });

        if (!analysis) {
            return res.status(404).json({ message: "Analysis not found." });
        }

        return res.status(200).json({ analysis });
    } catch (error) {
        console.error("Error fetching analysis:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAnalyses = async (req, res) => {
    try {
        const analyses = await Analysis.find({ user: req.userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            count: analyses.length,
            analyses,
        });
    } catch (error) {
        console.error("Error fetching analyses:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.findOneAndDelete({
            _id: req.params.id,
            user: req.userId,
        });

        if (!analysis) {
            return res.status(404).json({ message: "Analysis not found." });
        }

        return res.status(200).json({ message: "Analysis deleted successfully." });
    } catch (error) {
        console.error("Error deleting analysis:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};