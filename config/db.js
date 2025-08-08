const mongoose = require('mongoose');

const connectDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected SUCCESSFULLY...');

    } catch (error) {
        console.error('MongoDB connection FAIL');
        log.error('MongoDB FAIL Message :', error.message);
    }
}

module.exports = connectDB;