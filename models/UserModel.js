const mongoose = require('mongoose')

const userSchema =  new mongoose.Schema({
    name : {
        type : String,
        required : [true, "Please enter name"]
    },
    email : {
        type : String,
        required : [true,"Please enter email"],
        unique : true
    },
    password : {
        type : String,
        required : [true, "Please enter password"]
    },
    profile_pic : {
        type : String,
        default : ""
    }
},{
    timestamps : true
})

const UserModel = mongoose.model('User',userSchema)

module.exports = UserModel