
const express = require('express');
const registerUser = require('../controllers/registerUser');
const loginUser = require('../controllers/loginUser');
const checkEmail = require('../controllers/checkEmail');
const userDetails = require('../controllers/userDetails');
const updateUserDetails = require('../controllers/updateUserDetails');

const router = express.Router()

router.post('/register',registerUser)
router.post('/email',checkEmail)
router.post('/login',loginUser)
router.get('/user',userDetails)
router.post('/update',updateUserDetails)

module.exports = router