require("dotenv").config();

const express = require("express");
const app = express();
const authRouter = require("./routes/authRoutes");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const createError = require("http-errors");

require("./helpers/init_mongodb");

const { verifyAccessToken } = require("./helpers/jwtHelper")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded({
//     extended:true
// }));
app.use(morgan("dev"));

app.use("/auth", authRouter);


app.get("/", verifyAccessToken, async (req, res, next) => {
    res.send("helo from express");
});

// mongoose.connect(process.env.MONGODB_SERVER_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });
/////////////////////////////////////////////////////////////////////

//if any random route is hitted

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



////////////////////////////////////////////////////////////////////

// to check if connection is succesful or not

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`server started at port ${port}`);
});

// const conc = mongoose.connection;
// conc.on("open", () => {
//     app.listen("3000", () => { console.log("server started at port 3000 and db is connected") });
// });