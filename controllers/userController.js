import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../utils/sendGrid.js';
import User from '../models/user.js';
import Joi from 'joi';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarsDir = path.join(__dirname, '../public/avatars');

export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const newUser = new User({
      email,
      password: hashedPassword,
      verify: false,
      verificationToken,
    });

    await newUser.save();

    const verificationLink = `${req.protocol}://${req.get('host')}/api/users/verify/${verificationToken}`;
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: 'User registered. Verification email sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verify) {
      return res.status(400).json({ message: 'Email already verified. No action required.' });
    }

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'missing required field email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verify) {
      return res.status(400).json({ message: 'Verification has already been passed' });
    }

    const verificationLink = `${req.protocol}://${req.get('host')}/api/users/verify/${user.verificationToken}`;
    await sendVerificationEmail(email, verificationLink);

    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const { path: tempUpload, originalname } = req.file;
    const { _id: userId } = req.user;

    const extension = path.extname(originalname);
    const filename = `${userId}${extension}`;
    const resultUpload = path.join(avatarsDir, filename);

    await sharp(tempUpload)
      .resize(250, 250)
      .toFile(resultUpload);

    await fs.unlink(tempUpload);

    const avatarURL = `/avatars/${filename}`;
    await User.findByIdAndUpdate(userId, { avatarURL });

    res.status(200).json({ avatarURL });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};