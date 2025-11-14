//khud se middleware define kr rhe hain
//ye sirf verify krega ki user hain ya ni h
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT=asyncHandler(async(req,_,next)=>{
  try{
     //req ke pass cookie ka access h
  const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
   
  if(!token){
    throw new ApiError(401,"unauthorized request")
  }

  //agar token hain
  const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  const user=await User.findById(decodedToken?._id).select(
    "-password -refreshToken"
  )
  if(!user){
    //discuss abt frontend
    throw new ApiError(401,"Invalid Access Token")
  }
  //agar user hai
  req.user=user;
  next()

  }catch(error){
    throw new ApiError(401,error?.message ||"Invalid Access Token")

  }
  

})