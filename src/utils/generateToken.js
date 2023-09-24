const jwt = require("jsonwebtoken");
const UserAccessToken = require("../model/userAccessToken");
const UserRefreshToken = require("../model/userRefreshToken");
const dotenv = require('dotenv');
dotenv.config();


const generateToken = async(user) => {
    try {
        const payload = {userId: user._id };
        const accessToken = jwt.sign(
            payload,
            process.env.ACCESS_TOKEN_KEY,
            { expiresIn: process.env.ACCESS_TOKEN_LIFE }
            );
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_KEY,
            { expiresIn: process.env.REFRESH_TOKEN_LIFE}
            );

        return ({ accessToken, refreshToken });
    } catch (err) {
        return Promise.reject(err);
    }
};

const saveTokens = async (user, accessToken, refreshToken) => {
    await new UserAccessToken({ userId: user._id, token: accessToken }).save();
    await new UserRefreshToken({ userId: user._id, token: refreshToken }).save();
};

module.exports = {
    generateToken,
    saveTokens,
};