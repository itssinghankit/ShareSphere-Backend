// const jwt = require("jsonwebtoken");
// const createError = require("http-errors");

// module.exports = {

//     //for creating access token
//     signAccessToken: (userId) => {
//         return new Promise((resolve, reject) => {
//             const payload = {};
//             const secret = process.env.ACCESS_TOKEN_SECRET;
//             const options = {
//                 expiresIn: "1h",
//                 audience: userId
//             };
//             jwt.sign(payload, secret, options, (err, token) => {
//                 if (err) reject(createError.InternalServerError());
//                 resolve(token);
//             })
//         })
//     },

//     //for creating refresh token
//     signRefreshToken: (userId) => {
//         return new Promise((resolve, reject) => {
//             const payload = {};
//             const secret = process.env.REFRESH_TOKEN_SECRET;
//             const options = {
//                 expiresIn: "1y",
//                 audience: userId
//             }
//             jwt.sign(payload, secret, options, (err, token) => {
//                 if (err) reject(createError.InternalServerError());
//                 resolve(token);
//             })
//         })
//     },

//     verifyAccessToken: (req, res, next) => {

//         //authorization should start with small letters
//         if (!req.headers["authorization"]) throw createError.Unauthorized();

//         const authHeader = req.headers["authorization"];
//         const bearerToken = authHeader.split(" ");
//         const token = bearerToken[1];

//         jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
//             if (err) {
//                 const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
//                 next(createError.Unauthorized(message));
//             }
//             req.payload = payload;
//             next();
//         });
//     },

//     verifyRefreshToken: (refreshToken) => {
//         return new Promise((resolve, reject) => {
//             jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
//                 if (err) reject(createError.InternalServerError());

//                 const userId = payload.aud;
//                 resolve(userId);
//             })
//         })
//     }

// };