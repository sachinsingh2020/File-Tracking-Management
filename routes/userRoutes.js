import express from 'express';
import { forgetPassword, isUserLoggedIn, login, logout, register, resetPassword } from '../controllers/userController.js';

const router = express.Router();

router.route('/register').post(register);

router.route('/login').post(login);

router.route('/logout').get(logout);

router.route('/forgetpassword').post(forgetPassword);

router.route('/resetpassword/:token').put(resetPassword);

router.route('/isloggedin').get(isUserLoggedIn);

export default router;