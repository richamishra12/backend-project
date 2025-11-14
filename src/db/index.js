import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"; 

//db is in another continent therefore async await is used
const connectDB=async()=>{
    //db connect me problem aa skti hai to try catch me rakho
    try{
     const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}`) //mongoose return object deta hain

     console.log(`\n MONGODB connnected!!DB HOST:${connectionInstance.connection.host}`)

    }catch(error){
        //handle error
        console.log("MONGODB connection error",error);
        //nodejs access deta hai process ka
        //process-> ye current jo application chal rhi hai na wo ek process pe chal rhi hogi aur ye uska reference hain
        process.exit(1)
    }
}
export default connectDB