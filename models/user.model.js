const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
    },
    profilePic: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    },
    public_id: {
        type: String,
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post',
    }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
}, { timestamps: true });


module.exports = mongoose.model('user', userSchema);