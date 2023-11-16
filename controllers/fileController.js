import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler.js";
import ApiFeatures from "../utils/apiFeatures.js";
import { File } from "../models/fileModel.js";
import { User } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";


export const transferNewFile = catchAsyncError(async (req, res, next) => {

    const { fileName, facultyName, startingPosition, destination, currentStatus, updatedBy, supplyChain, facultyEmail } = req.body;

    // console.log({ fileName, facultyName, startingPosition, destination, currentStatus, supplyChain })

    if (!fileName || !facultyName || !startingPosition || !destination || !currentStatus || !updatedBy || !supplyChain || !facultyEmail) {
        return next(new ErrorHandler('Please fill in all the fields', 400));
    }

    const file = req.file;

    if (!file) {
        return next(new ErrorHandler('Please upload a file', 400));
    }

    const fileUri = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    let updateFaculty = [];
    if (updatedBy === 'Only Me') {
        updateFaculty.push(req.user.fullName);
    } else {
        updateFaculty = await User.find({});
        updateFaculty = updateFaculty.map(user => user.fullName);
    }

    let usableDate = Date.now();

    let mySupplyChain = [];
    if (supplyChain) {
        mySupplyChain = supplyChain.split(',');
        mySupplyChain.push('Completed');
    }

    const fileDetail = await File.create({
        fileUrl: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        },
        fileName,
        facultyName,
        startingPosition,
        destination,
        currentStatus,
        updatedBy: updateFaculty,
        supplyChain: mySupplyChain,
        facultyEmail,
        date: usableDate,
    });

    await fileDetail.save();

    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        fileDetail
    });
});

export const getAllFiles = catchAsyncError(async (req, res, next) => {
    const apiFeatures = new ApiFeatures(File.find(), req.query).search();

    const files = await apiFeatures.query.sort({ createdAt: -1 });


    res.status(200).json({
        success: true,
        files
    });
});

export const getFileById = catchAsyncError(async (req, res, next) => {
    // console.log("Sachin Singh")
    // console.log(req.params.id);
    const file = await File.findById(req.params.id);

    if (!file) {
        return next(new ErrorHandler('File not found', 404));
    }

    res.status(200).json({
        success: true,
        file
    });
});

export const updateFilePosition = catchAsyncError(async (req, res, next) => {
    const file = await File.findById(req.params.id);
    // console.log({ file });

    if (!file) {
        return next(new ErrorHandler('File not found', 404));
    }

    const { currentStatus } = req.body;
    console.log(currentStatus);

    file.currentStatus = currentStatus;

    if (currentStatus === 'Completed') {
        const message = `Your file ${file.fileName} has been completed. Please visit Adminstration to take further action /n/n Regards, /n/n Gautam Buddha University`;

        await sendEmail(file.facultyEmail, "Regarding Your Application", message);
    }

    file.save();

    if (currentStatus === 'Completed') {
        return res.status(200).json({
            success: true,
            file,
            message: `File is Completed and Mail has been sent to the applicant ${file.facultyName}`
        });
    } else {
        return res.status(200).json({
            success: true,
            file,
        });

    }
});

export const deleteFile = catchAsyncError(async (req, res, next) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return next(new ErrorHandler('File not found', 404));
    }

    await File.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        message: 'File deleted successfully'
    });
});