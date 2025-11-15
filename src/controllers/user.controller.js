

import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary}  from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


//5.of userLogin
const generateAccessAndRefereshTokens=async(userId)=>{

  try{
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken //user ke andar add kra diya
      //ab save v krana hoga
     await user.save({validateBeforeSave:false}) //validation kuch mt lgao sidha jake save krao
     return {accessToken,refreshToken}

  }catch(error){
    throw new ApiError(500,"Something went wrong while generating access and referesh token")
  }
}

const registerUser=asyncHandler(async(req,res)=>{

  console.log("BODY:", req.body);
console.log("FILES:", req.files);

   //1..get user details from frontend(postman ke through data le skte h(user detail))
   //2..validation->sb kuch empty to ni h
   //3..check if user already exit(check with username or email)
   //4..check for images,check for avatar files hain ya ni(avatar,coverimage)
   //5..upload them to cloudinary,check avatar
   //6..create user object->create entry in db
   //7..remove password and refresh token field from response
   //8..check for user creation
   //9..return response else error

   //1..
   const {fullName,email,username,password}=req.body //postman se //ye sirf data ko handle kr rha h
  //  console.log("email:",email);

   //2.
   if (
    [fullName, email, username, password].some((field) => !field?.trim()==="")
    ) {
  throw new ApiError(400, "All fields are required");
}

    
  //3.
 const existedUser=await User.findOne({
    $or:[{ username }, { email }]
  })

  if(existedUser){ //if user already exist
    throw new ApiError(409,"User with email or username already exists")
  }
  //console.log(req.files);

  //4
   //abhi khud ke server pe h cloudinary me ni gya
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

// const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
  coverImageLocalPath=req.files.coverImage[0].path
}


  

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }

  //5
 const avatar=await uploadOnCloudinary(avatarLocalPath) //jbtk upload ni ho jata wait kro
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  

  //check for avatar bcz it is rqd field
 // Recommended Correction:
  //check for avatar bcz it is rqd field
  if(!avatar){
    throw new ApiError(500, "Failed to upload avatar to Cloudinary");
  }
  //6
  //DB entry //User hi baat kr rha h database se
  const user=await User.create({
    fullName,
    avatar:avatar.url, //yha avatar hain hi qki upar check ho gya h
    coverImage: coverImage?.url || "", //yha coverImage hai ya ni jaruri ni qki upar check ni hua h,agar hain to url niakl lo agar ni h to empty rehne do
    email,
    password,
    username:username.toLowerCase()

  })

  //7

  const createdUser=await User.findById(user._id).select(        //ye mil gya to user create hua tha
    //yha jo jo ni chahiye
    "-password -refreshToken"
     )

     //8 check for usercreation
     if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
     }

     //9 agar user properly bn gya h to response me bhej do sbko wapas
     //API RESPONSE
     return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")

     )
     



})

//login
const loginUser=asyncHandler(async(req,res)=>{
  //todos likhna hain
  //1.req body se data le aao
  //2.username or email se access dena chahte h user ko(dono me se kisi ek se login kra skte h)
  //3.find the user(user hai ki ni h)
  //4.agar user mil jata hain to password check krwao(password check)
  //agar password check ni hua to wrong h try again
  //5.password agar check ho gya to access and refresh token(dono generate krna hoga aur dono hi user ko bhejenge)
  //6.mostly isko cookies me bhejte hain
      // send cookies
  //7.send response successfully logged in

  //1.
  const{email,username,password}=req.body
  console.log(email);
  //2.
  if(!username && !email){
    throw new ApiError(400,"username or email is required ")
  }

  const user=await User.findOne({   ////ya email dhund do ya username dhund do
   $or:[{username},{email}] //or operator find krega val ko ya username ya email ke based pe mil jaye

  })    
  //3. 
  //or lga ke v user ni mila to wo kabhi register tha hi ni
  if(!user){
    throw new ApiError(404,"User does not exist ")
  }
  //4.agar user mil gya to password check
  const isPasswordValid=await user.isPasswordCorrect(password)//this password comes from req.body jo user de rha h

  if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
  }

  //5.
  const{accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)//is method se accesstoken aur refreshtoken mil rha

  //6.
  //cookies me bhejo
  //user ko kya-kya info bhejni hain
  const loggedInUser =await User.findById(user._id).select(
    "-password -refreshToken"
  )
  const options={  //options for cookies
    httpOnly:true,
    secure:true //by default cookie ko koi v modify kr skta h frontend pe , isse ye cookie sirf server se modify hoti hain
  }
  
  //7.
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      //data
      {
        user:loggedInUser,accessToken,
        refreshToken
      },
      "User logged in Successfully"
    )
  )


})


//logOut
const logoutUser=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id, //user find
  {
    $unset:{
      refreshToken:1
    }
  },

    {
      new:true //res me new val aayegi
    }

  )
  //cookie
  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},"User logged Out")
  )




  //cookies sb hta do
  //refreshtoken ko v reset krna hoga

})

//end point
const refreshAccessToken=asyncHandler(async(req,res)=>{
 const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken

 if(!incomingRefreshToken){
  throw new ApiError(401,"unauthorized request")
 }
 try{
  //incoming token verify
 const decodedToken=jwt.verify(
  incomingRefreshToken,
  process.env.REFRESH_TOKEN_SECRET) //verify hone ke baad decoded token milega

  const user=await User.findById(decodedToken?._id)

  if(!user){
  throw new ApiError(401,"invalid refresh token")
 }

 if(incomingRefreshToken!==user?.refreshToken){
  throw new ApiError(401,"Refresh token is expired or used ")
 }

 const options={
  httpOnly:true,
  secure:true
 }
const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._Id)
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new ApiResponse(
    200,
    {accessToken,refreshToken:newRefreshToken},
    "Access token refreshed"
  )
)



 }catch(error){
  throw new ApiError(401,error?.message) || "invalid refresh token"


 }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  //user se current password change krwana hain
  const{oldPassword,newPassword}=req.body
  //or
  //const{oldPassword,newPassword,confirmPassword}=req.body
  //if(!(newPassword==confirmPassword)){
  //throw new ApiError(400,"invalid password")
  //}

  const user=await User.findById(req.user?._id)
 const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

 if(!isPasswordCorrect){
  throw new ApiError(400,"Invalid old password")
 }
 //new password set
 user.password=newPassword
 //save
 await user.save({validateBeforeSave:false})

 return res.status(200)
 .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})
// text based data update
const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName && !email){
    throw new ApiError(400,"All fields are required")
  }
  //update info
 const user= await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{ //its job is to update specific field without replacing the entire document
        fullName,
        email:email
      }
    },
    {new:true} //update hone ke baad jo info h wo return hoti hain

  ).select("-password")
  return res.status(200)
  .json(new ApiResponse(200,user,"account details updated successfully"))
})

//how to update files
//middleware used
//1st middleware used (multer)->taki files accept kr paye
//whi log update kr payenge jo logged in ho

//update Avatar
const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path //multer middleware ke through mila

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")

  }
  //upload on cloudinary
 const avatar=await uploadOnCloudinary(avatarLocalPath)

 if(!avatar.url){ //agar ni mila url
  throw new ApiError(400,"Error while uploading avatar")

 }
 //ab update krna hain
 //object update ho rha
 const user=await User.findByIdAndUpdate(req.user?._id,
  {
    $set:{
      avatar:avatar.url //change avatar with avatar.url
    }
  },
  {new:true}
 ).select("-password")

 return res.status(200)
 .json(new ApiResponse(200,user,"Avatar updated successfully"))

})

//update coverImage
const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"coverImage file is missing")
  }
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){ //agar url ni h
    throw new ApiError(400,"Error while uploading coverImage")

  }
  //update
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url

      }
    },
   {new:true}
  
  ).select("-password")


  return res
  .status(200)
  .json(
    new ApiResponse(
    200,user,"coverImage updated successfully"
  ))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
 const {username}= req.params //url se req nikalenge
 if(!username?.trim()){ //ho skta h params empty ho
  throw new ApiError(400,"username is missing")
 }
 //username se pehle document find kr lete hain
 const channel=await User.aggregate[
  {
    //1st pipeline
    //match field kaise match kre
    $match:{
      username:username?.toLowerCase()
    }
  },
  {
    //mere kitne subscriber hain
    $lookup:{
      from:"subscriptions", //DB me plural me
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"

    }
  },
  {
    //maine kitne subscribe kiya h
    $lookup:{
      from:"subscriptions", //DB me plural me
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
  },
  {
    $addFields:{
      subscribersCount:{
        $size:"$subscribers"
      },
      channelsSubscribedToCount:{
        $size:"$subscribedTo"
      },
      isSubscribed:{
        $cond:{
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false
        }
      }
    }
  },
  {
    $project:{ //selected chize dunga
      fullName:1, //flag on
      username:1,
      subscribersCount:1,
      channelsSubscribedToCount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1



    }
  }
 ]
 if(!channel?.length){
  throw new ApiError(404,"channel does not exist")
 }

 return res
 .status(200)
 .json(
  new ApiResponse(200,channel[0],"User channel fetched successfully")
 )

})





export {registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
}