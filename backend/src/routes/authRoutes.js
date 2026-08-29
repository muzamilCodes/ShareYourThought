import { Router } from 'express';
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  sendForgotPasswordOtp,
  sendLoginOtp,
  sendRegisterOtp,
  verifyLoginOtp,
  verifyRegisterOtp,
  verifyResetPasswordOtp
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// OTP-based Authentication routes
router.post('/otp/send-register', sendRegisterOtp);
router.post('/send-register-otp', sendRegisterOtp);

router.post('/otp/verify-register', verifyRegisterOtp);
router.post('/verify-register-otp', verifyRegisterOtp);

router.post('/otp/send-login', sendLoginOtp);
router.post('/send-login-otp', sendLoginOtp);

router.post('/otp/verify-login', verifyLoginOtp);
router.post('/verify-login-otp', verifyLoginOtp);

router.post('/otp/send-forgot-password', sendForgotPasswordOtp);
router.post('/send-forgot-password-otp', sendForgotPasswordOtp);

router.post('/otp/verify-reset-password', verifyResetPasswordOtp);
router.post('/verify-reset-password-otp', verifyResetPasswordOtp);

// Standard Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;


