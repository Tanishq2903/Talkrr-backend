const express = require('express');
const cors = require('cors');
require('dotenv').config()
const router = require('./routes/index');
const connectDB = require('./config/connectDB')
const cookiesParser = require('cookie-parser')


const app = express()
app.use(cors({
    origin : process.env.FRONTEND_URL,
    credentials:true
}))
app.use(express.json())
app.use(cookiesParser())


const PORT = process.env.PORT || 5000
app.get('/' , (req,res) => {
    res.json({
       "message": "server is running fine"
    })
})



//api end point
app.use('/api',router)



connectDB().then(() => {
    app.listen(PORT,() => {
        console.log("server is listing")
    })
})