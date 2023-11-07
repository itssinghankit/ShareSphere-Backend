require("dotenv").config();

const userModel = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../middlewares/authentication.js");
const GenerateAccessToken = require("../middlewares/authentication.js");

const createError = require("http-errors");

const signup = async (req, res, next) => {

    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) throw createError.BadRequest

        const doesExist = await userModel.findOne({ email: email });

        if (doesExist) throw createError.Conflict(`${email} is already registered`);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({ email: email, password: hashedPassword, username: username });
        const savedUser = await user.save();

        res.send(req.body);


    } catch (error) {
        next(error)
    }

    // try {

    // const existingUser = await userModel.findOne({ email: email });

    // if (existingUser) {
    //     return res.status(400).json({ message: "user already exist" });
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);

    // const result = await userModel.create({
    //     email: email,
    //     password: hashedPassword,
    //     username: username
    // });
    // res.status(201).json(req.body);

    // } catch (error) {
    //     res.status(500).json({ message: "Something went wrong" });
    // }

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

        const accessToken = GenerateAccessToken(user);
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        res.json({ email: email, password: password, accessToken: accessToken, refreshToken: refreshToken });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }

};

const refreshToken = async (req, res) => {

};

module.exports = { signup, signin, refreshToken };



// customer -> app --> ro -> problem -> create ticket->
// support  -> help --> temp access check-> access token support --> expire karana hai after 24hrs of deletion of ticket // access token store send
// org -> req temp 

