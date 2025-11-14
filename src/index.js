// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import app from "./app.js"


//dotenv.config({}) ek method hai jo object leta h
dotenv.config({
    path:'./.env'
}) //root directory path ke andar hi .env file h


connectDB()

 
//db ka asynchronous method likha h jo promise return krta h
.then(()=>{
    //abhi tk sirf database connect hua tha server start ni hua tha
    // to app ka use krke listen krenge
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running at port: ${process.env.PORT}`)
    })

    
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!",err);
})
//error ke liye listen krenge
app.on("error",(error)=>{
        console.log("application not able to talk to DB");
        throw error
      })










//1st approach
/*
import express from "express"
const app=express()
( async () =>{
    //database se jb v baat kro try catch lgao
    try{
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      //add listener(app ke pass hota h listeners)
      app.on("error",(error)=>{
        console.log("application not able to talk to DB");
        throw error
      })
      app.listen(Process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
      })


    }catch(error){
        console.log(error)
        throw err
    }
})()   //;for cleaning purpose
   */