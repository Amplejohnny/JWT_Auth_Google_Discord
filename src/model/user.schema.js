const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema({
    email: { type: String, unique: true },
    password: { type: String },
    token: { type: String },
    createdAt: { type: Date, default: Date.now},
});

module.exports = model("User", userSchema);



