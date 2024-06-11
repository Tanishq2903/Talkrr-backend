const express = require('express');
const cors = require('cors');
require('dotenv').config()
const router = require('./routes/register');
const connectDB = require('./config/connectDB')


const app = express()
app.use(cors({
    origin : process.env.FRONTEND_URL,
    credentials:true
}))
app.use(express.json())
const PORT = process.env.PORT || 5000
app.get('/' , (req,res) => {
    res.json({
       "message": "server is running fine"
    })
})

app.use('/api',router)
connectDB().then(() => {
    app.listen(PORT,() => {
        console.log("server is listing")
    })
})