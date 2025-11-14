
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET

});

 const uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath) return null //agar file path hai hi ni
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto" //kaunsa resource le rhe hain(image,raw,videos)

        })
        //file has been uploaded successfully
        // console.log("file is uploaded in cloudinary",response.url);
        //user ko v kuch return krna hoga

        fs.unlinkSync(localFilePath)
        return response; //jo data chahiye response me se le lega

    }catch(error){
        //file save ho gya ab server se hta do
        fs.unlinkSync(localFilePath) //remove the locally save temporary file as the upload operation got failed
        return null;

    }
 
 }

 export  {uploadOnCloudinary}