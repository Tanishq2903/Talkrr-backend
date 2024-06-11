const UserModel = require("../models/UserModel")
const bcryptjs = require('bcryptjs');

async function registerUser(req,res){
    try {
        const{name,email,password,profile_pic} = req.body
     //check if email exist already
        const checkIfAlreadyExist = await UserModel.findOne({email})
        if(checkIfAlreadyExist){
            return res.status(400).json({
                message : "email already exists" ,
                error : true
            }) 
//if not exist than first convert password into hash
            const salt = bcryptjs.genSalt(10)
            const hashPassword = await bcryptjs.hash(password,salt)
//collect all details in single variable
         const userDetails = {
            name,
            email,
            password : hashPassword,
            profile_pic
         }
     //create new usermodel
         const user = new UserModel(userDetails)
         //save that model in database
         const userSave = await user.save()

        
        }
        return res.status(200).json({
            message : "user registered successfully"
         })
    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true
        })
    }
}
 

module.exports = registerUser