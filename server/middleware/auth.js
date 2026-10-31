import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token || token.split(".").length !== 3) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = verifyToken(token);
        if (!decoded?.sub) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findById(decoded.sub).select("tokenVersion");
        if (!user || decoded.tokenVersion !== (user.tokenVersion ?? 0)) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = decoded;
        req.userId = decoded.sub;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

export default auth;

