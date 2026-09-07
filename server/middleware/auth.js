import jwt from "jsonwebtoken";

//to check the request is valid jwt token or not
const auth = async (req,res,next)=>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({message: "Unauthorized"});
        }
// if bearer abc123 is provided in the header, we need to extract the token from it. The token is the part after "Bearer "
        const token = authHeader.split(" ")[1]; //to extract the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.userId = decoded.id;
        next();
    }catch(error){
        res.status(401).json({message: "Unauthorized"});
    }
}

export default auth;

