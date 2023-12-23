import Nodemailer from "nodemailer"
import Randomstring from "randomstring";

const transporter=Nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD
    }
});