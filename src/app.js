// const express = require("express");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import ApiError from "./utils/ApiError.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    // limit:"16kb"
}));

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.route.js";
//routes
app.use("/api/v1/user", userRouter);

//error generation
app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use(async (err, req, res, next) => {
    res.status(err.status).json( new ApiError(err.status, err.message, err))
})

export { app };