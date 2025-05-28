import express from 'express';
import * as auth from '../controllers/authController.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', auth.signUp);
router.post('/login', auth.login);
router.post('/logout', protectRoute ,auth.logout);

router.post('/refresh-token', auth.refreshToken);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/verify-email', auth.verifyEmail);
router.post('/resend-verification-email', auth.resendVerificationEmail);


export default router;