import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

//to check the request is valid jwt token or not
const auth = async (req,res,next)=>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({message: "Unauthorized"});
        }
// if bearer abc123 is provided in the header, we need to extract the token from it. The token is the part after "Bearer "
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token || token.split(".").length !== 3) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.sub).select("tokenVersion");
        if (!user || decoded.tokenVersion !== (user.tokenVersion ?? 0)) {
            return res.status(401).json({message: "Unauthorized"});
        }

        req.user = decoded;
        req.userId = decoded.sub;
        next();
    }catch(error){
        res.status(401).json({message: "Unauthorized"});
    }
}

export default auth;

