import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { User } from "../models/userModel.js";
import jwt from 'jsonwebtoken';

export const register = catchAsyncError(async (req, res, next) => {
    const { fullName, email, password, mobileNum } = req.body;

    if (!fullName || !email || !password || !mobileNum) {
        return next(new ErrorHandler('Please fill all the fields', 400));
    }

    let user = await User.findOne({ email });

    if (user) {
        return next(new ErrorHandler('User already exists', 400));
    }

    user = await User.create({
        fullName,
        email,
        password,
        mobileNum,
    });

    sendToken(res, user, "Registered Successfully", 201);

});

export const login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(new ErrorHandler('Invalid email or password', 401));
    }

    sendToken(res, user, `Welcome Back ${user.fullName}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
    res
        .status(200)
        .cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            // secure: true,
            sameSite: "none",
        })
        .json({
            success: true,
            message: "Logged Out Successfully",
            isAuthenticated: false,
        });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return next(new ErrorHandler("User not found", 400));

    const resetToken = await user.getResetToken();

    await user.save();

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `Click on the link to reset your password. ${url} If you have not request then please ignore.`;

    // Send token via email
    await sendEmail(user.email, "Reset Password for GBU Movies", message);

    res.status(200).json({
        success: true,
        message: `Reset Token has been sent to ${user.email}`,
    });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params;

    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now(),
        },
    });

    if (!user)
        return next(new ErrorHandler("Token is invalid or has been expired", 401));

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password Changed Successfully",
    });
});

export const isUserLoggedIn = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    // console.log(token);

    if (!token) return next(new ErrorHandler("Please login to access", 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await User.findById(decoded._id);
    let isAuthenticated = false;
    if (user) {
        isAuthenticated = true;
    }

    res.status(200).json({
        success: true,
        user,
        isAuthenticated,
        message: "User is logged in",
    });
});