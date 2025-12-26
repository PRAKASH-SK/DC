require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const authRoute = require("./routes/authRoutes");
const studentRoute = require("./routes/studentRoutes");
const facultyRoute = require("./routes/facultyRoute");
const adminRoute = require("./routes/adminRoute")
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/api',authRoute);
app.use('/api',studentRoute);
app.use('/api',facultyRoute);
app.use('/api',adminRoute);

app.use((req,res,next) => {
    next(createError.NotFound("api do not found"));
})

app.use((error,req,res,next) => {
    res.status(error.status || 500);
    res.send({
        error:{
            status: error.status || 500,
            message: error.message
        }
    })
})

app.listen(PORT, () => console.log("Server is running on port"+PORT));
