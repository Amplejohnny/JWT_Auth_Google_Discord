const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userRefreshTokenSchema = new Schema({
    userId: { type: String, required: true },
    token: { 
        type: String, 
        ref: 'UserAccessToken', 
        required: true, 
     }, 
    createdAt: { type: Date, default: Date.now },
});

module.exports = model("UserRefreshToken", userRefreshTokenSchema);