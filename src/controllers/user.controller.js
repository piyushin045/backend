import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, " something went wrong while generating refresh and access token")
    }
}

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

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // step4:- avatar and images
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if(req.files &&Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log(avatarLocalPath); // avatar file get uploaded
    // step:- 5 check for avatar

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar filed is required")
    }


    // step6:- upload them to cloudnary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatar)
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

// login user

const loginUser = asyncHandler(async(req,res) => {
    // req body -> data
    // username or email 
    // find the user
    // password check 
    // ascess and refresh token 
    // send cookies


    const {email , username, password } = req.body

    if(!username && !email ){
        throw new ApiError(400,"username or email is required")
    }
    
    // here is an alternate of above code based on logic discussed in video;
    // if(!(username || email)){
    // throw new ApiError(400,"username or email is required")}
    
    
    
    // find user

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    // to check the password

    const isPasswordValid = await user.isPasswordCorrect(password)


    if(!isPasswordValid) {
        throw new ApiError(401, " password incorrect")
    }

    // acesss and refresh token

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    // for cookies

    const options = {
        httpOnly: true, // only server can be modified
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

})

// for logout we have to clear cookies and reset the refresh token
const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: undefined // this will remove the feild from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true, // only server can be modified
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,  {}, "User logged out" ))


})

// refresh and access token ka end point

const refreshAccessToken = asyncHandler(async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(incomingRefreshToken) {
        throw new ApiError(401,"unauthorised request")
    }

    // verify the token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // refresh token is decoded now by using mongodb query we cank find that user
    
        const user = await User.findById(decodedToken?._id)
    
         if(!user) {
            throw new ApiError(401,"invalid refresh token")
        }
    
        // now we are matching the token we have previously saved and the token saved in user
    
        if(!incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        } 
    
        // if token match then generate new
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken}, // same value bhi use kar sakte the
                "Acess token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}