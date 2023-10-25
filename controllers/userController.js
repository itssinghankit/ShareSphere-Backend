const userModel = require("../models/user.js");
const bcrypt = require("bcrypt");
const express=require("express")

const signup = async (req, res) => {

    const { username, email, password } = req.body;
    try {
        
        const existingUser = await userModel.findOne({ email: email });

        if (existingUser) {
            return res.status(400).json({ message: "user already exist" });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const result = await userModel.create({
            email: email,
            password: hashedPassword,
            username: username
        });
        res.status(201).json(req.body);

    } catch (error) {
        res.status(500).json({message:"Something went wrong"})
    }

    // if(result){
    //     console.log(result);
    //     res.json({message:"user created succesfully"});
    // }

};
const signin = async (req, res) => {

};

module.exports = { signup, signin };
