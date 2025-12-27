const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const userAuth = require("../middlewares/userAuth");

router.post("/auth/login",userAuth,auth.login);
router.post("/auth/logout",userAuth,auth.logout);
router.post('/auth/google', userAuth,auth.googleSignIn);
module.exports = router;
