import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import ApiError from "./utils/ApiError.js";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import chatRouter from "./routes/chat/chat.route.js";
import { initializeSocketIO } from "./socket/index.js";
import messageRouter from "./routes/chat/message.route.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    },
});

app.set("io", io); // using set method to mount the `io` instance on the app to avoid usage of `global`


const corsConfig = {
    origin: process.env.CORS_ORIGIN,
    credentials: true
};
app.use(cors(corsConfig));

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"));
app.use(cookieParser());

//initializing socket io for chat
initializeSocketIO(io)

//routes
app.get("/", (req, res) => {
    res.sendfile(path.join(__dirname, "/views/index.html"), { message: "Hello from backend" });
});
app.get("/api/v1", (req, res) => {
    res.json({ message: "Hello from v1 backend" });
});

//auth routes
app.use("/api/v1/user", userRouter);

//post routes
app.use("/api/v1/post", postRouter);

//chat routes
app.use("/api/v1/chat", chatRouter);

//message routes
app.use("/api/v1/message", messageRouter);

//error generation
app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use(async (err, req, res, next) => {
    res.status(err.status).json(new ApiError(err.status, err.message, err));
})

// export { app };
export { httpServer }