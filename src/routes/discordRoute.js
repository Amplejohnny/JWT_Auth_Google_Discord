const express = require('express');
const User = require('../model/user.schema');
const { generateToken, saveTokens } = require('../utils/generateToken');

const router = express.Router();

router.use(express.json());

const { DISCORD_CLIENT_ID:client_id, DISCORD_CLIENT_SECRET:client_secret, DISCORD_REDIRECT_URI:redirect_uri} = process.env;

router.get('/', (req, res) => {
  const {code, state} = req.query;
  try {
    //get code and state from url params
    if (code && state) {
      return res.json({code , state})
    }
    //define the scopes to use
    const scopes = [
      'identify email',
    ];
    //generate the authorization url
    const discordAuthorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=15773059ghq9183habn2154&prompt=consent`;
    //send the authorization url to the client
    res.send(`<a href="${discordAuthorizeUrl}">Login with Discord</a>`);
  } catch (error) {
    console.log(error);
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
    const tokenEndpoint = 'https://discord.com/api/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);

    const responseToken = await fetch(tokenEndpoint, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const responseTokenJson = await responseToken.json();
    const { access_token } = responseTokenJson;
    //exchange access token for user profile
    const responseDetailsURL = 'https://discord.com/api/v10/users/@me';
    const responseDetails = await fetch(responseDetailsURL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const profile = await responseDetails.json();

    // Collect the field data you want in your database
    const { email } = profile;

    // Check if the user already exists in the database and create a new user if not
    const user = await User.findOne({ email:profile.email });
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
        },
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
        msg: 'New user created!',
        status: 'success',
        data: {
          profile,
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      msg: 'Login Unsuccessful',
      status: 'Failed',
      data: null,
      error: error.message,
    });
  }
});


module.exports = router;
