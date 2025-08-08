const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(400).json({
                message: "Token not found !"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (!decoded) {
            return res.status(400).json({
                message: "Invalid token !"
            })
        }

        const user = await User.findById(decoded.token)
            .populate("followers")
            // .populate("posts")
            // .populate("replies")
            // .populate("reposts");
        if (!user) {
            return res.status(400).json({
                message: "User not found !"
            })
        }
        req.user = user;
        next();

    } catch (error) {
        return res.status(400).json({
            message: "Error in authMiddleware !",
            error: error.message
        });
    }
};


module.exports = authMiddleware;