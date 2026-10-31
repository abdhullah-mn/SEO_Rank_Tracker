import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedName = String(name ?? "").trim();
        const normalizedEmail = normalizeEmail(email);
        const trimmedPassword = String(password ?? "").trim();

        if (!normalizedName || !normalizedEmail || !trimmedPassword) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        if (trimmedPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password: hashedPassword,
        });

        const token = generateToken({ id: user._id, tokenVersion: user.tokenVersion });

        const safeUser = user.toObject();
        delete safeUser.password;
        return res.status(201).json({ success: true, message: "User created successfully", user: safeUser, token });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const trimmedPassword = String(password ?? "").trim();

        if (!normalizedEmail || !trimmedPassword) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (!existingUser) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(trimmedPassword, existingUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken({ id: existingUser._id, tokenVersion: existingUser.tokenVersion });

        const safeUser = existingUser.toObject();
        delete safeUser.password;
        return res.status(200).json({ success: true, message: "Login successful", user: safeUser, token });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
