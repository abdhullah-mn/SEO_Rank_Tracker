import express from "express";
import { register, login, getUser, updateUser, logout } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/user", auth, getUser);
authRouter.patch("/user", auth, updateUser);
authRouter.post("/logout", auth, logout);

export default authRouter;