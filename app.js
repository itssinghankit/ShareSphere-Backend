require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRouter = require("./routes/userRoutes");
const bodyParser = require("body-parser");

app.use(express.json());
// app.use(bodyParser.urlencoded({
//     extended:true
// }));

app.use("/user", userRouter);


app.get("/", (req, res) => {

})

mongoose.connect(process.env.MONGODB_SERVER_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// to check if connection is succesful or not

const conc = mongoose.connection;
conc.on("open", () => {
    app.listen("3000", () => { console.log("server started at port 3000 and db is connected") });
});