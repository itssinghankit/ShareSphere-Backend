import Nodemailer from "nodemailer";
import createError from "http-errors";
import { asyncHandler } from "./asyncHandler.js";

const transporter = Nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

// Function to send email
const sendEmail = async (email, subject, message) => {

    const mailOptions = {
        from: {name: "ShareSphere", address:email},
        to: email,
        subject: subject,
        text: message
    };

    //sending the message
    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            throw createError.InternalServerError("An internal error occurred while sending the OTP")
        } else {
            console.log("Email sent: " + info.response);
        }

    });
};

export {sendEmail};
