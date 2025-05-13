const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    registeredDate: {
        type: Date,
        default: Date.now
    },
    lastLoginDate: {
        type: Date
    },
    loginCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('User', userSchema);