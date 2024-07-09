const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel.js');

const getUserDetailsFromToken = async (token) => {
    if (!token) {
        console.log('No token provided');
        return {
            message: "session out",
            logout: true,
        };
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decode.id).select('-password');

        if (!user) {
            console.log('User not found for token:', token);
            return {
                message: "User not found",
                logout: true,
            };
        }

        return user;
    } catch (error) {
        console.error('Error verifying token or fetching user:', error);
        return {
            message: "session out",
            logout: true,
        };
    }
};

module.exports = getUserDetailsFromToken;
