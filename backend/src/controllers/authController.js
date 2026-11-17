import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { normalizeTimeZone } from '../utils/timeZone.js';
import { getJwtSecret } from '../utils/jwtSecret.js';

/**
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, password, role }
 */
export const register = asyncHandler(async (req, res) => {
  getJwtSecret();
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { name, email, password, role } = body;

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof password !== 'string' || !password ||
    typeof role !== 'string' || !role
  ) {
    throw new ApiError(400, 'Name, email, password, and role are required.');
  }

  if (name.trim().length > 100 || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new ApiError(400, 'Please provide a valid name and email address.');
  }

  if (!['PATIENT', 'CARETAKER'].includes(role)) {
    throw new ApiError(400, 'Role must be either PATIENT or CARETAKER.');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
    timeZone: normalizeTimeZone(req.get('X-Time-Zone')) || 'UTC',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      user,
      token,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { email, password }
 */
export const login = asyncHandler(async (req, res) => {
  getJwtSecret();
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { email, password } = body;

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  // password has select:false on the schema, so explicitly include it here
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const timeZone = normalizeTimeZone(req.get('X-Time-Zone'));
  if (timeZone && timeZone !== user.timeZone) {
    user.timeZone = timeZone;
    await user.save();
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user, // toJSON() strips password automatically
      token,
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by the `protect` middleware
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  const { profileImage } = req.body;
  const match = typeof profileImage === 'string'
    ? profileImage.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i)
    : null;

  if (!match) {
    throw new ApiError(400, 'Upload a JPG, PNG, or WEBP profile image.');
  }

  const [, declaredMime, encodedImage] = match;
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encodedImage)) {
    throw new ApiError(400, 'The profile image data is invalid.');
  }

  const imageBuffer = Buffer.from(encodedImage, 'base64');
  if (imageBuffer.length > 512 * 1024) {
    throw new ApiError(413, 'Profile images must be 512 KB or smaller.');
  }

  const normalizedMime = declaredMime.toLowerCase();
  const detectedMime = imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff
    ? 'image/jpeg'
    : imageBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ? 'image/png'
      : imageBuffer.toString('ascii', 0, 4) === 'RIFF' && imageBuffer.toString('ascii', 8, 12) === 'WEBP'
        ? 'image/webp'
        : null;

  if (!detectedMime || detectedMime !== normalizedMime) {
    throw new ApiError(400, 'The profile image contents do not match a supported image format.');
  }

  req.user.profileImage = profileImage;
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Profile image updated successfully.',
    data: { user: req.user },
  });
});
