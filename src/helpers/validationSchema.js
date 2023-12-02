import Joi from "joi";

const joiSignupSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().required()
});

export {joiSignupSchema};