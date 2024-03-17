import mongoose from "mongoose";

const dateSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    }
});

export const DateModel = mongoose.model("Date", dateSchema);