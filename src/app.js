import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app =express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true //allow
}))
app.use(express.json({limit:"16Kb"}))

app.use(express.urlencoded({extended:true,limit:"16Kb"}))

app.use(express.static("public"))

app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'


//routes declaration
//pehle app.get likhte the route aur functionality ek sath likte hain ab seperate kr diye to middleware layenge
app.use("/api/v1/users",userRouter)  //koi user agar type krega /users to control de doge userRouter pe...userRouter file me jayega aur wha pe kaam perform krenge

//http://localhost:8000/api/v1/users/register
//http://localhost:8000/api/v1/users/login






export default app