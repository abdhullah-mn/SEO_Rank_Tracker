import express from "express";
import { register, login, getUser, logout } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/user", auth, getUser);
authRouter.post("/logout", auth, logout);

export default authRouter;