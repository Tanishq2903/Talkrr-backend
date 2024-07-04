
const express = require('express');
const registerUser = require('../controllers/registerUser');
const loginUser = require('../controllers/loginUser');
const checkEmail = require('../controllers/checkEmail');
const userDetails = require('../controllers/userDetails');
const updateUserDetails = require('../controllers/updateUserDetails');
const logout = require('../controllers/logout');

const router = express.Router()

router.post('/register',registerUser)
router.post('/email',checkEmail)
router.post('/login',loginUser)
router.get('/user',userDetails)
router.post('/update',updateUserDetails)
router.get('/logout',logout)


module.exports = router