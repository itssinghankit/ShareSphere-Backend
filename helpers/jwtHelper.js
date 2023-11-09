const jwt = require("jsonwebtoken");
const createError= require("http-errors");

module.exports ={

    //for creating access token
    signAccessToken:(userId)=>{
        return new Promise((resolve,reject)=>{
            const payload={};
            const secret =process.env.ACCESS_TOKEN_SECRET;
            const options= {
                expiresIn:"15s",
                audience:userId
            };
            jwt.sign(payload,secret,options,(err,token)=>{
                if(err) reject(err);
                resolve(token);
            })
        })
    }
}