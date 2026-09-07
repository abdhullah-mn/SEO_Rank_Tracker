import mongoose from "mongoose";

const keywordTrackingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        keyword: {
            type: String,
            required: true,
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            trim: true,
        },
        url: {
            type: String,
            required: true,
            trim: true,
        },
        currentPosition: {
            type: Number,
            default: null,
        },
        bestPosition: {
            type: Number,
            default: null,
        },
        positionChange: {
            type: Number,
            default: 0,
        },
        active: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["active", "paused", "checking", "completed"],
            default: "active",
        },
        lastChecked: {
            type: Date,
            default: null,
        },
        competitors: [
            {
                position: Number,
                url: String,
                domain: String,
                title: String,
                snippet: String,
            },
        ],
    },
    { timestamps: true }
);

keywordTrackingSchema.index({ user: 1, keyword: 1, domain: 1 }, { unique: true });

const KeywordTracking = mongoose.model("KeywordTracking", keywordTrackingSchema);

export default KeywordTracking;
