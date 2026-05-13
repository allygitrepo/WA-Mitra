const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
require("dotenv").config();

const client = new OAuth2Client(process.env.CLIENT_ID);

const oauthService = {
  verifyGoogleToken: async (token) => {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });
      const payload = ticket.getPayload();
      return {
        googleId: payload["sub"],
        email: payload["email"],
        username: payload["name"],
        email_verified: payload["email_verified"],
      };
    } catch (error) {
      console.error("Google Token Verification Error:", error);
      return null;
    }
  },
  verifyGoogleAccessToken: async (accessToken) => {
    try {
      const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      const data = response.data;
      return {
        googleId: data.sub,
        email: data.email,
        username: data.name,
        email_verified: data.email_verified,
      };
    } catch (error) {
      console.error("Google Access Token Verification Error:", error);
      return null;
    }
  },
};

module.exports = oauthService;
