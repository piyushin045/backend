// require('dotenv').config({path:'./env'})
// int he above line ther is consistency issue
import dotenv from "dotenv"
import mongoose from "mongoose"; /// beacuse it will connect through database
import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: './env'
})


connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Server is running at port : ${process.env.PORT}`)
  })
})
.catch((error) => {
  console.log("mongoDB connection failed !!",error);
})































// thwo things we have to keep remember while taking to databases
// first:- wrap in try catch or handle it with resolve and reject
//second :- database is in other continent means it will take time
// i.e .. use async await

// function connectDB(){}

// connectDB()
// or by uisng ife :- imediate execute function




/* // this is our first approach
import express from "express"
const app = express()


( ansyc () => {
    try {
      await  mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      app.on("error",(error)=>{
        console.log("error:",error);
        throw error
      })

      app.listen(process.env.PORT,() =>{
        console.log(`App is listening on port ${
            process.env.PORT}`);
      })

    } catch (error) {
        console.error("error:",error)
        throw error
    }
})() */