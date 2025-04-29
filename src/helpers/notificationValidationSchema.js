import Joi from "joi"

const joiSaveFcmToken =Joi.object({
    token:Joi.string().required()
})

export{ joiSaveFcmToken }