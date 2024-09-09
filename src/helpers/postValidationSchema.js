import Joi from "joi";
import joiObjectid from "joi-objectid";

Joi.objectId=joiObjectid(Joi)

//likePost validation
const joiLikePost = Joi.object({
    postId: Joi.objectId().required()
});

const joiFollowUser = Joi.object({
    accountId: Joi.objectId().required()
});

const joiViewAccount = Joi.object({
    accountId: Joi.objectId().required()
});

const joiViewAccountFollowers = Joi.object({
    accountId: Joi.objectId().required()
});

const joiViewAccountFollowing = Joi.object({
    accountId: Joi.objectId().required()
});

const joiSavePost = Joi.object({
    postId: Joi.objectId().required()
});
const joiComment = Joi.object({
    postId: Joi.objectId().required(),
    content: Joi.string().required()
});
const joishowComments = Joi.object({
    postId: Joi.objectId().required()
});


export {joiLikePost, joiFollowUser,joiViewAccount,joiViewAccountFollowers,joiViewAccountFollowing,joiSavePost,joiComment,joishowComments}