import Joi from "joi";
import joiObjectid from "joi-objectid";

Joi.objectId=joiObjectid(Joi)

//likePost validation
const joiLikePost = Joi.object({
    postId: Joi.objectId().required()
});

export {joiLikePost}