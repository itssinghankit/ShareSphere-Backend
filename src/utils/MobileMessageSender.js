import Twilio from "twilio";
import createError from "http-errors";

const sendMessage = async (phoneNumber, message) => {

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = Twilio(accountSid, authToken);

    await client.messages
        .create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${phoneNumber}`
        })
        .then(LocalMessage => console.log(`Message sent to ${phoneNumber}`))
        .catch(error => {
            console.error('Error sending message:', error)
            throw createError.InternalServerError("An internal error occurred while sending the OTP")
        });
}

export { sendMessage };