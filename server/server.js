import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import keywordRouter from "./routes/keywordRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";

connectDB(); // Connect to MongoDB

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all routes(connecting the frontend and backend)
app.use(express.json()); // Middleware to parse incoming JSON requests


app.get("/", (_request, response) => {
	response.json({ message: "SEO Rank Tracker server is running" });
});
app.use("/api/auth", authRouter); // Use the authRouter for authentication routes
app.use("/api/keywords", keywordRouter);
app.use("/api/analyses", analysisRouter);

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
