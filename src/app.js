const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./model/user.schema');
const { hashPassword, comparePassword } = require('./utils/helpers');
const { generateToken, saveTokens } = require('./utils/generateToken');
const connect = require('./config/database');
const auth = require('./middleware/auth');
const verifyRefreshToken = require('./utils/verifyRefreshToken');
const UserRefreshToken = require('./model/userRefreshToken');
const googleRoute = require('./routes/googleRoute');
const discordRoute = require('./routes/discordRoute');
dotenv.config();
// require('./middleware/googleAuth');

connect();

const app = express();
app.use(express.json());


//validation function using regrex
const is_valid_Email = (mail) => (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
const is_valid_Password = (password) => (/^(?=.*[a-zA-Z0-9])(?=.*[\p{P}\p{S}])(?!.*\s).{8,}$/u.test(password))
 
const validate = ({ email, password }) => {
    if ( password.length < 8 )
        throw new Error("passwword too short")
    if ( !is_valid_Password(password) )
        throw new Error("Password must not contain spaces and have at least 8 characters including one special character")
    if ( !is_valid_Email(email) )
        throw new Error("Enter a valid email")
    if ( !password )
        throw new Error('Password cannot be empty');
    if ( !email ) 
        throw new Error('Email cannot be empty');
};


app.post("/api/auth/signup", async(req, res) => {
    const { email, password } = req.body;
    try{
        validate(req.body)
    } catch(err){
        return res.status(400).send({
            msg: 'Validation Error',
            status: 'Failed',
            data: null,
            error: err.message
        });
    }
    try {
        if (await User.findOne({ email })) {
            throw new Error('email already exists');
        } else {
        const hashedPassword = hashPassword(password);
        const data = {
            email: email.toLowerCase(),
            password: hashedPassword,
          }
        const user = await User.create(data);
        //create token
        const token = jwt.sign(
            { userId: user._id, email },
            process.env.ACCESS_TOKEN_KEY,
            {
              expiresIn: process.env.ACCESS_TOKEN_Life,
            }
          );
        user.token = token;
        res.status(201).json({ 
            msg: 'new user created!',
            status: 'success',
            data: { email }
        });
        };
    } catch(err) {
        return res.status(400).send({
            msg: 'Registration Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    };
});



app.post("/api/auth/login", async(req, res) => {
    try {
        const { email , password } = req.body;
        if (!email)
            throw new Error('Email cannot be empty');
        if (!password)
            throw new Error('Password cannot be empty');
        const user = await User.findOne({ email });
        if(!user)
            throw new Error("User does not exist")
        const isValid = comparePassword(password , user.password);
            if (isValid) {
            const { accessToken, refreshToken } = await generateToken(user); 
            await saveTokens(
                user, 
                accessToken, 
                refreshToken
            );
            res.status(200).send({ 
                msg: 'Login successful!',
                status: 'success',
                data: { accessToken, refreshToken }
            });
            } else {
                return res.status(401).send({
                    msg: 'Invalid Authetication',
                    status: 'Failed',
                    data: null,
                    error: 'Incorrect password'
                })
            }
    } catch(err){
        return res.status(400).send({
            msg: 'Login Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    };
});



app.post("/api/auth/refreshToken", async(req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) 
            throw new Error('Refresh token cannot be empty');
        const { tokenDetails } = await verifyRefreshToken(refreshToken);
        const { userId } = tokenDetails;
        const user = await User.findById(userId);
        if (!user) 
            throw new Error('User not found');
        await UserRefreshToken.findOne({token: refreshToken}).findOneAndRemove()
        const { accessToken, refreshToken: newRefreshToken } = await generateToken(user);
        await saveTokens(
            user,
            accessToken,
            newRefreshToken
        );
        res.status(200).send({ 
            msg: 'Refresh successful!',
            status: 'success',
            data: { accessToken, refreshToken: newRefreshToken }
        });
    } catch(err){
        return res.status(400).send({
            msg: 'Refresh Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    };
});



app.post("/api/auth/changePassword", auth, async(req, res) => {
    try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId});
    const isValid = comparePassword(oldPassword , user.password);
    if(!isValid) {
        throw new Error("Invalld Password")
    } else {
        const hashedPassword = hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();
        res.status(200).send({
            msg: 'Password changed successfully!',
            status: 'success',
            data: null
        });
    }
    } catch(err) {
        console.log(err)
        return res.status(400).send({
            msg: 'Password change Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    }
});

app.delete("/api/auth/logout", auth, async(req, res) => {
    try {
        const userId = req.user.userId;
        await UserRefreshToken.findOneAndRemove({ _id:userId });
        res.status(200).send({
            msg: 'Logout successful!',
            status: 'success',
            data: null
        });
    } catch(err) {
        return res.status(400).send({
            msg: 'Logout Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    }
});



app.use('/api/auth/google', googleRoute);
app.use('/api/auth/discord', discordRoute);

module.exports = app;

