import mongoose from 'mongoose';
import validator from "validator";


const schema = new mongoose.Schema({
    fileUrl: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    fileName: {
        type: String,
        required: true
    },
    facultyName: {
        type: String,
        required: true
    },
    facultyEmail: {
        type: String,
        validate: [validator.isEmail, "Please enter valid email address"]
    },
    startingPosition: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    currentStatus: {
        type: String,
        required: true
    },
    supplyChain: {
        type: [String],
        default: []
    },
    updatedBy: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const File = mongoose.model('File', schema);