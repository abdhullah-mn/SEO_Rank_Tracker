import mongoose from "mongoose";

const keywordRankHistorySchema = new mongoose.Schema(
	{
		keyword: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "KeywordTracking",
			required: true,
			index: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		position: {
			type: Number,
			min: 1,
			default: null,
		},
		checkedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

keywordRankHistorySchema.index({ keyword: 1, checkedAt: -1 });
keywordRankHistorySchema.index({ user: 1, keyword: 1, checkedAt: -1 });

const KeywordRankHistory = mongoose.model("KeywordRankHistory", keywordRankHistorySchema);

export default KeywordRankHistory;