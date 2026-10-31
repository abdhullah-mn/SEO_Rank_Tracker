import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on("connected", () => console.log("MongoDB connected successfully"));
    mongoose.connection.on("error", (error) => console.error("MongoDB connection error:", error.message));

    return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/SEO_Rank_Tracker");
};

export default connectDB;