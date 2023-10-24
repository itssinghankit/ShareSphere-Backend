const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    email: {
        typeof: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username: String

}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);