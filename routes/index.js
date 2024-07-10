const express = require('express');
const registerUser = require('../controller/registerUser.js');
const checkEmail = require('../controller/checkEmail.js');
const checkPassword = require('../controller/checkPassword.js');
const userDetails = require('../controller/userDetails.js');
const logout = require('../controller/logout.js');
const updateUserDetails = require('../controller/updateUserDetails.js');
const searchUser = require('../controller/searchUser.js');
const getMessages = require('../controller/getMessages.js');
const sendMessage = require('../controller/messageController.js');



const router = express.Router();

// Create user API
router.post('/register', registerUser);
// Check user email
router.post('/email', checkEmail);
// Check user password
router.post('/password', checkPassword);
// Login user details
router.get('/user-details', userDetails);
// Logout user
router.get('/logout', logout);
// Update user details
router.post('/update-user', updateUserDetails);
// Search user
router.post('/search-user', searchUser);

// Message routes
router.post('/messages/send',sendMessage );
router.get('/messages/conversation/:conversationId',getMessages); 
module.exports = router;
