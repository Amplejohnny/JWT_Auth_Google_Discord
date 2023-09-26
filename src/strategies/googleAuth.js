const express = require('express');
const googleClientSecretJson = require('../googleClientSecret.json');
const { OAuth2Client } = require('google-auth-library');
const User = require('../model/user.schema');
const { generateToken, saveTokens } = require('../utils/generateToken');
const router = express.Router();

router.use(express.json());

const {redirect_uris} = process.env;


router.get('/', (req, res) => {
    const {code} = req.query;
    try {
        //get code from url params
        if (code) {
            return res.json({code})
        }
        //provide the credentials to be used using the client secret json file and .env file(redirect_uris)
        const oauth2Client = new OAuth2Client(
            googleClientSecretJson.web.client_id,
            googleClientSecretJson.web.client_secret,
            redirect_uris
        );
        //define the scopes to use
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        ];
        //generate the authorization url
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes
        });
        //send the authorization url to the client
        res.send(`<a href="${authorizeUrl}">Login with Google</a>`);
            
    } catch (error) {
        return res.status(401).send({
            msg: 'Authorization Unsuccessful',
            status: 'Failed',
            data: null,
            error: error.message
        })
    }
});


router.post('/login', async (req, res) => {
    const {code} = req.body;
    try {
        //exchange Authorization code for access token
        const oauth2Client = new OAuth2Client(
            googleClientSecretJson.web.client_id,   
            googleClientSecretJson.web.client_secret,
            redirect_uris
        );
        const responseToken = await oauth2Client.getToken(code);
        const {tokens} = responseToken;
        const {access_token} = tokens;
        //exchange access token for user profile
        const url = `https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${access_token}`;
        const responseDetails = await fetch(url);
        const profile = await responseDetails.json();
        //collect the field data you want in your database
        const { email } = profile;
        //check if user already exists in database and create new user if not
        const user = await User.findOne({email});
        if (user) { 
        const { accessToken, refreshToken } = await generateToken(user); 
        await saveTokens(
            user, 
            accessToken, 
            refreshToken
        );
        res.status(200).send({ 
            msg: 'Login successful!',
            status: 'success',
            data: {
                profile,
                accessToken,
                refreshToken,
            }
        }); 
        } else {
            const newUser = new User({
                email,
            });
            await newUser.save();
            const { accessToken, refreshToken } = await generateToken(newUser);
            await saveTokens(
                newUser,
                accessToken,
                refreshToken
            );
            res.status(201).send({ 
                msg: 'new user created!',
                status: 'success',
                data: {
                    profile,
                    accessToken,
                    refreshToken,
                }
            });
        }
    } catch (error) {
        return res.status(401).send({
            msg: 'Login Unsuccessful',
            status: 'Failed',
            data: null,
            error: error.message
        })
    }
});



module.exports = router;