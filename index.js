const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const router = require('./routes/user.routes');
const cookieParser = require('cookie-parser');
const cors = require("cors");

dotenv.config();
const app = express();
connectDB();

app.use(cors({
    // origin: "https://socialix.netlify.app",
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],

}))
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('API is running....');
})

// Routes
app.use('/api', router);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);

});