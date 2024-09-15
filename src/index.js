// require("dotenv").config();

// const express = require("express");
// const app = express();

// const bodyParser = require("body-parser");
// const createError = require("http-errors");
// const morgan = require("morgan");

// //for initializing mongodb
// require("./helpers/init_mongodb");

// //Routers
// const authRouter = require("./routes/authRoutes");

// //verification middleware
// const { verifyAccessToken } = require("./helpers/jwtHelper")

// //to parse the incoming json or form requests
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// //logger for requests
// app.use(morgan("dev"));

// //auth route for login signup
// app.use("/auth", authRouter);

// //home route to check if server is working fine
// app.get("/check", verifyAccessToken, async (req, res, next) => {
//     res.send("access token verified succesfully");
// });

// app.get("/", async (req, res) => {
//     res.send("hello from express");
// });


// //to create an error
// app.use(async (req, res, next) => {
//     next(createError.NotFound());
// });

// app.use(async (err, req, res, next) => {
    
    // res.status(err.status).json({
    //     code: err.status || 500,
    //     message: err.message

    // });
// })

// // to check if connection is succesful or not
// const port = process.env.PORT || 3000;

// app.listen(port, () => {
//     console.log(`server started at port ${port}`);
// });

import dotenv from "dotenv"
import connectDB from "./db/init.mongodb.js"
// import { app } from "./app.js"
import { httpServer } from "./app.js";

dotenv.config({
    path: "../.env"
});

connectDB().then(() => {
    httpServer.listen(process.env.PORT || 3000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
}).catch((err) => {
    console.log("MongoDB connection failed: ", err);
});