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
import cyberStrikeRouter from "./routes/cyberstrike.route.js";
//routes
app.get("/", (req, res) => {
    res.json({message:"Hello from backend"});
});
app.get("/api/v1", (req, res) => {
    res.json({message:"Hello from v1 backend"});
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", cyberStrikeRouter);

//error generation
app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use(async (err, req, res, next) => {
    res.status(err.status).json( new ApiError(err.status, err.message, err));
})

export { app };