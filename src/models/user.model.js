import mongoose  from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema=new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true  //for searching in DB
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
         fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinary third party service url use krenge
            required:true
        },
        coverImage:{
            type:String, //cloudinary third party service url use krenge

        },
        watchHistory://array hain qki multiple value hogi
        [
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshToken:{ //long string
            type:String
        },
    },
    {
        timestamps:true
    }

)
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,10)
    next() //save krte time password ko automatically encrypt kr diya jayega
})

//how password checked 
userSchema.methods.isPasswordCorrect=async function(password){
   return await bcrypt.compare(password,this.password) //T OR F

}

userSchema.methods.generateAccessToken= function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName //db se aa rhi
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken= function(){
     return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User=mongoose.model("User",userSchema)