require("dotenv").config();

const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const createError = require("http-errors");
const morgan = require("morgan");

//for initializing mongodb
require("./helpers/init_mongodb");

//Routers
const authRouter = require("./routes/authRoutes");

//verification middleware
const { verifyAccessToken } = require("./helpers/jwtHelper")

//to parse the incoming json or form requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

//auth route for login signup
app.use("/auth", authRouter);

//home route to check if server is working fine
app.get("/",(req, res) => {
    res.send("hello from express");
});

//to create an error
app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use(async (err, req, res, next) => {
    res.status = err.status;
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})

// to check if connection is succesful or not
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`server started at port ${port}`);
});