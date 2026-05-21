const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, forgotPassword, resetPassword, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// 👇 1. SETUP MULTER (Handles the file upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save in 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Name the file: user-ID-Timestamp.jpg
    cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5000000 } // Limit: 5MB
});

// 👇 ROUTES

// IMPORTANT: Public routes (register, login, forgot, reset)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// IMPORTANT: Specific routes like /me MUST come BEFORE generic :id route
router.get('/me', protect, getMe);

// Generic routes LAST
router.get('/:id', protect, getUserById);

// 👇 2. ADD 'upload.single' HERE! (Crucial)
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;