const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: "./.env" })
const connectDB = require('./config/connectDB')
const router = require('./routes/index')
const cookieParser = require('cookie-parser')
const { app, server } = require('./sockets/index')

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

const PORT = process.env.PORT || 8080

app.get('/', (request, response) => {
    response.json({
        message: "Server running at " + PORT
    })
})

// API endpoints
app.use('/api', router)

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server running at " + PORT)
    })
}).catch(error => {
    console.error("Database connection failed:", error)
})
