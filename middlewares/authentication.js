const jwt = require("jsonwebtoken");

const GenerateAccessToken =  (user) => {
    return accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}

module.exports = GenerateAccessToken;