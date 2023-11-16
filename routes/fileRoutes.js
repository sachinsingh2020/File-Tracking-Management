import express from 'express';
import singleUpload from '../middlewares/multer.js';
import { deleteFile, getAllFiles, getFileById, transferNewFile, updateFilePosition } from '../controllers/fileController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.route('/transfer').post(isAuthenticated, singleUpload, transferNewFile);

router.route('/files').get(getAllFiles);

router.route('/file/:id').get(getFileById);

router.route('/file/:id').put(isAuthenticated, updateFilePosition);

router.route('/file/:id').delete(isAuthenticated, deleteFile);

export default router;
