const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");

exports.login = (req, res, next) => {
    try{
        const {emailId, password} = req.body;
        if(!emailId.trim() || !password.trim()) {
         return next(createError.BadRequest("EmailId or Password is missing!"));
        }
        const sql = `select * from users where emailId = ? and password = ?`;           
        const values = [emailId, password];
        db.query(sql,values,(error,result) => {
            if(error) {
                return next(error)
            }
            if(result.length === 0){
               return next(createError.Unauthorized("Invalid emailId or password"));

            }
            const user = result[0];
            const token = jwt.sign({id: user.user_id},process.env.JWT_SECRET,{expiresIn: "1h"});
            res.cookie("token", token); 

            const responseData = {
                message: "login successful",
                token: token,
                user_id: user.user_id,
                user_name: user.name,
                email_id: user.emailId,
                role_id: user.role_id,
            };
            if (user.role_id === 1) {
                responseData.year = user.year; // assuming column name is year_of_study
            }
            res.json(responseData);
        })
    
    }
    catch(error){
        return res.send(error);
    }
    
}

exports.logout = (req,res,next) => {
    try{
      res.clearCookie('token',{httpOnly: true, secure: true, sameSite: 'Strict'})
      res.send('User logged out successfully!');
    }
    catch(error)
    {
      next(error);
    }
}



const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In Controller
exports.googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;
    // console.log("Google ID Token:", idToken);

    // Validate input
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    // Verify Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken:  idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, email_verified } = payload;

    // require verified email
    if (!email || email_verified === false) {
      return res.status(400).json({
        success: false,
        message: 'Email missing or not verified on Google account'
      });
    }

    // Check if user exists in database
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM users WHERE emailId = ?',
      [email]
    );

    if (existingUsers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Account not registered. Please contact admin to get access.'
      });
    }

    const user = existingUsers[0];
    

    // Optional: Update google_id if not set
    if (!user.google_id) {
      try {
        await db.promise().query(
          'UPDATE users SET google_id = ? WHERE user_id = ?',
          [googleId, user.user_id]
        );
       
      } catch (err) {
        console.warn('Could not update google_id:', err.message);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Prepare response object
    const response = {
      success: true,
      message:  'Google sign-in successful',
      token:  token,
      user_id: user.user_id,
      user_name: user.name,
      email_id: user. emailId,
      role_id: user.role_id
    };

    // Add year if role_id = 1
    if (user.role_id === 1 && user.year) {
      response.year = user.year;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google sign-in',
      error: error.message
    });
  }
};