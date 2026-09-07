import express from "express";
import { register, login, getUser } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/user", auth, getUser);

export default authRouter;