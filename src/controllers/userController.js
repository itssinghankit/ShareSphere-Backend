// require("dotenv").config();

// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const createError = require("http-errors");
// const joi = require("joi");

// const userModel = require("../models/userModel.js");
// const joiAuthSchema = require("../helpers/validationSchema.js");

// const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwtHelper.js");

// const signup = async (req, res, next) => {

//     try {

//         const { email, password } = req.body;

//         //checking with joi wheather the incoming data fields are valid or not with joi

//         const result = await joiAuthSchema.validateAsync(req.body);
//         const doesExist = await userModel.findOne({ email: email });

//         if (doesExist) throw createError.Conflict(`${email} is already registered`);

//         const user = new userModel(result);
//         const savedUser = await user.save();

//         //creating new access and refresh token
//         const accessToken = await signAccessToken(savedUser.id);
//         const refreshToken = await signRefreshToken(savedUser.id);

//         res.status(201).json({ email, accessToken, refreshToken });

//     } catch (error) {
//         //if error is generated by joi then status code will be changed to 422
//         if (error.isJoi === true) error.status = 422
//         next(error)
//     }

// };
// const signin = async (req, res, next) => {

//     try {
//         const { email, password } = req.body;

//         const result = await joiAuthSchema.validateAsync(req.body);
//         const user = await userModel.findOne({ email: email });

//         if (!user) throw createError.NotFound("User not registered");

//         //we will use user not userModel as this.password will save in user by findOne() method
//         const isMatch = await user.isValidPassword(result.password);

//         if (!isMatch) throw createError.Unauthorized("Invalid username/password");

//         const accessToken = await signAccessToken(user.id);
//         const refreshToken = await signRefreshToken(user.id);

//         res.status(200).json({ email, accessToken, refreshToken });

//     } catch (err) {
//         //if error is given by joi validation failure
//         if (err.isJoi === true) next(createError.BadRequest("Invalid username/password"));

//         //else other errors
//         next(err);
//     }

// };

// const refreshToken = async (req, res, next) => {

//     try {
//         const { refreshToken } = req.body;

//         if (!refreshToken) next(createError.BadRequest);

//         const userId = await verifyRefreshToken(refreshToken);

//         //we can create new access and refresh token with this userId
//         const accToken = await signAccessToken(userId);
//         const refToken = await signRefreshToken(userId);

//         res.status(200).json({ accessToken: accToken, refreshToken: refToken });

//     } catch (error) {
//         next(error)
//     }
// };

// module.exports = { signup, signin, refreshToken };


