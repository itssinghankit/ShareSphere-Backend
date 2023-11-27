import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.ShareSphereDB, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected!! || DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed: ", error);
        process.exit(1);
    }
}

export default connectDB;