const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userAccessTokenSchema = new Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now },
});


module.exports = model("UserAccessToken", userAccessTokenSchema);