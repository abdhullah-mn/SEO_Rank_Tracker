import KeywordTracking from "../models/KeywordTracking.js";
import KeywordRankHistory from "../models/ImplementHistory.js";
import { checkKeywordRank } from "../services/rankProvider.js";

const saveRankHistory = async ({ keywordId, userId, position, checkedAt = new Date() }) => {
    return KeywordRankHistory.create({
        keyword: keywordId,
        user: userId,
        position,
        checkedAt,
    });
};

export const createKeyword = async (req, res) => {
    try {
        const { keyword, domain, url } = req.body;
        const userId = req.userId;

        if (!keyword || !domain || !url) {
            return res.status(400).json({ message: "Keyword, domain, and URL are required." });
        }

        const normalizedKeyword = keyword.trim().toLowerCase();
        const normalizedDomain = domain.trim().toLowerCase();

        const existingKeyword = await KeywordTracking.findOne({
            user: userId,
            keyword: normalizedKeyword,
            domain: normalizedDomain,
        });

        if (existingKeyword) {
            return res.status(409).json({
                message: "You are already tracking this keyword for this domain.",
            });
        }

        const trackingKeyword = await KeywordTracking.create({
            user: userId,
            keyword: normalizedKeyword,
            domain: normalizedDomain,
            url: url.trim(),
        });

        return res.status(201).json({
            message: "Keyword created successfully",
            keyword: trackingKeyword,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You are already tracking this keyword for this domain.",
            });
        }

        console.error("Error creating keyword:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getKeywords = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { status, active, domain, search } = req.query;
        const filters = { user: userId };

        if (status) {
            const validStatuses = ["active", "paused", "checking", "completed"];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid keyword status." });
            }

            filters.status = status;
        }

        if (active !== undefined) {
            if (active !== "true" && active !== "false") {
                return res.status(400).json({ message: "Active must be true or false." });
            }

            filters.active = active === "true";
        }

        if (domain?.trim()) {
            filters.domain = domain.trim().toLowerCase();
        }

        if (search?.trim()) {
            filters.keyword = { $regex: search.trim(), $options: "i" };
        }

        const keywords = await KeywordTracking.find(filters).sort({ createdAt: -1 });

        return res.status(200).json({
            count: keywords.length,
            keywords,
        });
    } catch (error) {
        console.error("Error fetching keywords:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getKeywordById = async (req,res)=>{
    try{
        const {id} = req.params;
        const userId = req.userId;

        const keyword = await KeywordTracking.findOne({ _id: id, user: userId });

        if (!keyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        return res.status(200).json({ keyword });
    } catch (error) {
        console.error("Error fetching keyword:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateKeyword = async (req,res)=>{
    try{
        const {id} = req.params;
        const userId = req.userId;
        const {keyword, domain, url, active, status} = req.body;

        const existingKeyword = await KeywordTracking.findOne({ _id: id, user: userId });

        if (!existingKeyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        // Update the keyword fields
        existingKeyword.keyword = keyword || existingKeyword.keyword;
        existingKeyword.domain = domain || existingKeyword.domain;
        existingKeyword.url = url || existingKeyword.url;
        existingKeyword.active = active !== undefined ? active === "true" : existingKeyword.active;
        existingKeyword.status = status || existingKeyword.status;

        const updatedKeyword = await existingKeyword.save();

        return res.status(200).json({ keyword: updatedKeyword });
    } catch (error) {
        console.error("Error updating keyword:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteKeyword = async (req,res)=>{
    try{
        const {id} = req.params;
        const userId = req.userId;

        const keyword = await KeywordTracking.findOne({ _id: id, user: userId });

        if (!keyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        await KeywordTracking.deleteOne({ _id: id, user: userId });
        await KeywordRankHistory.deleteMany({ keyword: id, user: userId });

        return res.status(200).json({ message: "Keyword deleted successfully." });
    } catch (error) {
        console.error("Error deleting keyword:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleKeywordActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const keyword = await KeywordTracking.findOne({ _id: id, user: userId });

        if (!keyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        keyword.active = !keyword.active;
        const updatedKeyword = await keyword.save();

        return res.status(200).json({ keyword: updatedKeyword });
    } catch (error) {
        console.error("Error toggling keyword active status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateKeywordrank = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { currentPosition: newPosition, status = "active" } = req.body;

        if (newPosition !== null && (!Number.isInteger(newPosition) || newPosition < 1)) {
            return res.status(400).json({
                message: "Current position must be a positive integer or null.",
            });
        }

        if (!["active", "completed"].includes(status)) {
            return res.status(400).json({
                message: "Status must be active or completed.",
            });
        }

        const keyword = await KeywordTracking.findOne({ _id: id, user: userId });

        if (!keyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        const previousPosition = keyword.currentPosition;
        const positionChange =
            previousPosition !== null && newPosition !== null
                ? previousPosition - newPosition
                : 0;

        const bestPosition =
            newPosition === null
                ? keyword.bestPosition
                : keyword.bestPosition === null
                    ? newPosition
                    : Math.min(keyword.bestPosition, newPosition);

        keyword.currentPosition = newPosition;
        keyword.positionChange = positionChange;
        keyword.bestPosition = bestPosition;
        keyword.lastChecked = new Date();
        keyword.status = status;

        const updatedKeyword = await keyword.save();
        await saveRankHistory({
            keywordId: keyword._id,
            userId,
            position: newPosition,
            checkedAt: keyword.lastChecked,
        });

        return res.status(200).json({ keyword: updatedKeyword });
    } catch (error) {
        console.error("Error updating keyword rank:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// to Checks the keyword rank through SerpApi and saves the latest position, changes, competitors, and check time for the authenticated user.

export const checkKeywordRankForTracking = async (req, res) => {
    try {
        const { id } = req.params; // keyword tracking record's ID, from the URL
        const userId = req.userId; // the logged-in user's ID (set by auth middleware)
        const keyword = await KeywordTracking.findOne({ _id: id, user: userId });

        if (!keyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        const previousStatus = keyword.status;
        const previousPosition = keyword.currentPosition;
        keyword.status = "checking";
        await keyword.save();

        try {
            const rankResult = await checkKeywordRank({
                keyword: keyword.keyword,
                domain: keyword.domain,
            });

            const newPosition = rankResult.currentPosition;
            const positionChange =
                previousPosition !== null && newPosition !== null
                    ? previousPosition - newPosition
                    : 0;
            const bestPosition =  //to findout best position of the keyword, if newPosition is null, we keep the previous bestPosition, if bestPosition is null, we set it to newPosition, otherwise we take the minimum of both.
                newPosition === null
                    ? keyword.bestPosition
                    : keyword.bestPosition === null
                        ? newPosition
                        : Math.min(keyword.bestPosition, newPosition);

            keyword.currentPosition = newPosition;
            keyword.positionChange = positionChange;
            keyword.bestPosition = bestPosition;
            keyword.competitors = rankResult.competitors;
            keyword.lastChecked = rankResult.searchedAt;
            keyword.status = "completed";

            const updatedKeyword = await keyword.save();
            await saveRankHistory({
                keywordId: keyword._id,
                userId,
                position: newPosition,
                checkedAt: rankResult.searchedAt,
            });

            return res.status(200).json({ keyword: updatedKeyword });
        } catch (error) {
            keyword.status = previousStatus === "checking" ? "active" : previousStatus;
            await keyword.save();
            throw error;
        }
    } catch (error) {
        console.error("Error checking keyword rank:", error);
        return res.status(502).json({
            message: error.message || "Unable to check keyword rank.",
        });
    }
};

export const getKeywordRankHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const keyword = await KeywordTracking.findOne({ _id: id, user: userId }).select("_id");

        if (!keyword) {
            return res.status(404).json({ message: "Keyword not found." });
        }

        const history = await KeywordRankHistory.find({
            keyword: keyword._id,
            user: userId,
        }).sort({ checkedAt: 1 });

        return res.status(200).json({
            count: history.length,
            history,
        });
    } catch (error) {
        console.error("Error fetching keyword rank history:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
