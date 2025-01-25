import express from 'express';
import multer from 'multer';
import { registerUser, verifyUser, resendVerificationEmail, uploadAvatar } from '../../controllers/userController.js';

const router = express.Router();
const upload = multer({ dest: 'temp/' });

router.post('/register', registerUser);
router.get('/verify/:verificationToken', verifyUser);
router.post('/verify', resendVerificationEmail);
router.patch('/avatars', upload.single('avatar'), uploadAvatar);

export default router;