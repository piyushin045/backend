import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar check
    // create user object- create entry in db, because mongodb me object ki taraha he file upload karate hai
    // remove password and refresh token field from response
    // check for user creation
    // return response

    // step:-1

    const {fullname, email, username,password} = req.body
    console.log("email", email);

    // step2: - validation 

    // if(fullname ===""){
    //     throw new ApiError(400, "fullname is requirred")
    // } // by uing if and else loop we can validate it one by one

    if(
        [fullname, email, password, username].some((field) =>
        field?.trim() === "") // it will trim the feild one by one trim karega and if it is empty then it wil return true 
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // assignment that we have to write email validation code

    // step:- 3 if user alrerady exist

    const existedUser = User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // step4:- avatar and images

    const avatarLocalPath = res.files?.avatar[0]?.path;
    const coverImageLoacalPath = req.files?.coverImage[0]?.path;

    // step:- 5 check for avatar

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // step6:- upload them to cloudnary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLoacalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
        
    }

    // step7:- create user object - create entry in database

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // by using select me - negative sign ke sath entries hai jo hame nahi lena hai
        // is a way to remove refresh token
    )
    // in the above code we have also find weather the user is created or not

    // step9:- check for user creation 

    if(!createdUser) {
        throw new ApiError(500, " something went wrong  while registering the user ")
    }
    
    // step 10 :- return response

    return res.status(201).json(
        new ApiResponse(200), createdUser, "User registered sucessfully"
    )



})



export {registerUser}