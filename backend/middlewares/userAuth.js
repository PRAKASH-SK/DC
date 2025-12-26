const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const db = require("../config/db");

const userAuth = (req,res,next) => {
    const token = req.cookies.token;
    if(!token) {
        return next(createError.BadRequest("Authentication token is missing"));
    }
    try{
       const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);
        db.query("select * from users where id = ?",[decodedMessage.id],(error,result) => {
            if(error)return next(createError.BadRequest(error));
            if(result.length === 0){
                return next(createError.NotFound("User not found"));
            }
            req.user = decodedMessage.id;
            next();
        })
    }
    catch(error){
        next(error);
    }
}

module.exports = userAuth;