import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";



//register user 
export const register = async (req,res)=>{
    try{

        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({message: "Please fill all the fields"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = generateToken({ id: user._id, tokenVersion: user.tokenVersion });

        const safeUser = user.toObject();
        delete safeUser.password;
        res.status(201).json({success: true, message: "User created successfully", user: safeUser, token});

    }catch(error){
        res.status(500).json({message: "Internal server error"});
    }
}

//login user
export const login = async (req,res)=>{
    try{

        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: "Please fill all the fields"});
        }

        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, existingUser.password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const token = generateToken({ id: existingUser._id, tokenVersion: existingUser.tokenVersion });

        const safeUser = existingUser.toObject();
        delete safeUser.password;
        res.status(200).json({success: true, message: "Login successful", user: safeUser, token});

    }catch(error){
        res.status(500).json({message: "Internal server error"});
    };
}

//get current user : get current user details
//getUser() identifies the logged-in user using their ID from the authentication middleware,
//retrieves their data from MongoDB without the password, and sends it to the frontend.


export const getUser = async (req,res)=>{
    try{

        const user = await User.findById(req.userId).select("-password"); //-password means we don't want to send the password in the response
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({success: true, user});


    }catch(error){
        res.status(500).json({message: "Internal server error"});
    };
}

export const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

