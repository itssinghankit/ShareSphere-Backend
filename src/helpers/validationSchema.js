import Joi from "joi";

const joiSignupSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().required()
});

//signinValidation for either username or email
const joiSigninSchema = Joi.object({
    usernameOrEmail: Joi.alternatives().try(
        Joi.string().email().lowercase(),
        Joi.string().min(3).max(30)
    ).required(),
    password: Joi.string().min(8).required(),
})

export { joiSignupSchema, joiSigninSchema };