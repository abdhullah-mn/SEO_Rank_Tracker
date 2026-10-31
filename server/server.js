import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import keywordRouter from "./routes/keywordRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";

export const app = express();
const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
	throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:8080,http://localhost:5173")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(cors({
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		return callback(new Error("Origin is not allowed by CORS"));
	},
}));
app.use(express.json());

app.get("/", (_request, response) => {
	response.json({ message: "SEO Rank Tracker server is running" });
});
app.get("/healthz", (_request, response) => {
	const isDatabaseReady = mongoose.connection.readyState === 1;
	response.status(isDatabaseReady ? 200 : 503).json({
		status: isDatabaseReady ? "ok" : "degraded",
		database: isDatabaseReady ? "connected" : "disconnected",
	});
});
app.use("/api/auth", authRouter);
app.use("/api/keywords", keywordRouter);
app.use("/api/analyses", analysisRouter);

export const startServer = async () => {
	await connectDB();
	return app.listen(port, () => {
		console.log(`Server listening on port ${port}`);
	});
};

if (process.env.NODE_ENV !== "test") {
	startServer().catch((error) => {
		console.error("Failed to start server:", error);
		process.exit(1);
	});
}

export default app;
