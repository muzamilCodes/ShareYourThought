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

// Registration routes
router.post('/register', register);
router.post('/register/send-otp', sendRegisterOtp);
router.post('/send-register-otp', sendRegisterOtp);
router.post('/otp/send-register', sendRegisterOtp);

router.post('/register/verify-otp', verifyRegisterOtp);
router.post('/verify-register-otp', verifyRegisterOtp);
router.post('/otp/verify-register', verifyRegisterOtp);

// Login routes
router.post('/login', login);
router.post('/login/send-otp', sendLoginOtp);
router.post('/send-login-otp', sendLoginOtp);
router.post('/otp/send-login', sendLoginOtp);

router.post('/login/verify-otp', verifyLoginOtp);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/otp/verify-login', verifyLoginOtp);

// Password Reset routes
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/send-forgot-password-otp', sendForgotPasswordOtp);
router.post('/otp/send-forgot-password', sendForgotPasswordOtp);

router.post('/reset-password', resetPassword);
router.post('/forgot-password/verify-otp', verifyResetPasswordOtp);
router.post('/verify-reset-password-otp', verifyResetPasswordOtp);
router.post('/otp/verify-reset-password', verifyResetPasswordOtp);

// Session & Profile
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
