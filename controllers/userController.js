require("dotenv").config();

const userModel = require("../models/user.js");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../middlewares/authentication.js");
const GenerateAccessToken = require("../middlewares/authentication.js");

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
        res.status(500).json({ message: "Something went wrong" });
    }

    // if(result){
    //     console.log(result);
    //     res.json({message:"user created succesfully"});
    // }

};
const signin = async (req, res) => {

    const { email, password } = req.body;
    
    try {
        const existingUser = await userModel.findOne({ email: email });

        if (!existingUser) {
            return res.status(404).json({ message: "user does not exist" });
        }
        
        const matchpassword = await bcrypt.compare(password, existingUser.password);
        console.log(matchpassword);

        if (!matchpassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = { email: email };

        const accessToken = await GenerateAccessToken(user);
        const refreshToken = await jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        res.json({ email: email, password: password, accessToken: accessToken, refreshToken: refreshToken });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }

};

module.exports = { signup, signin };
