const crypto = require('crypto');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    console.log(`\n📝 REGISTRATION ATTEMPT: ${email} (${role})`);

    // 1. Validate input
    if (!name || !email || !password || !role) {
      console.log(`❌ Missing fields`);
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`❌ User already exists: ${email}`);
      return res.status(400).json({ message: '❌ User already exists' });
    }

    // 3. Validate password length
    if (password.length < 6) {
      console.log(`❌ Password too short: ${email}`);
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // 4. Create User (pre-save hook will hash the password automatically)
    console.log(`⚙️ Creating user with hashing...`);
    const user = await User.create({
      name,
      email,
      password, // <--- Sent as plain text, pre-save hook hashes it
      role,
      walletBalance: 1000
    });

    console.log(`✅ User created successfully: ${email}`);
    console.log(`✅ Password hashed: ${user.password.substring(0, 10)}... (${user.password.length} chars)`);

    // 5. Respond with data & token
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      headline: user.headline,
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      avatar: user.avatar,
      rating: user.rating,
      walletBalance: user.walletBalance,
      token: token,
    });

    console.log(`✅ REGISTRATION SUCCESSFUL: ${email}\n`);
  } catch (error) {
    console.error('❌ Registration Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    console.log(`\n🔐 LOGIN ATTEMPT: ${email}`);

    // 2. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✅ User found: ${user.name} (${user._id})`);
    console.log(`🔍 Password check details:`);
    console.log(`   - Provided password length: ${password.length}`);
    console.log(`   - Stored hash length: ${user.password.length}`);
    console.log(`   - Stored hash starts with: ${user.password.substring(0, 15)}`);
    console.log(`   - Is hash valid bcrypt format: ${user.password.startsWith('$2b$') || user.password.startsWith('$2a$')}`);
    
    // 3. Check password matches the hash
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error(`❌ bcrypt.compare error:`, err.message);
      return res.status(401).json({ message: 'Password comparison failed. Invalid hash format in database.' });
    }
    
    console.log(`⚙️ bcrypt.compare result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✅ Password matched for: ${email}`);

    // 4. Password matches - return user data with token
    const token = generateToken(user._id);
    console.log(`✅ Token generated for: ${email}`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      headline: user.headline,
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      avatar: user.avatar,
      rating: user.rating,
      walletBalance: user.walletBalance,
      token: token,
    });

    console.log(`✅ LOGIN SUCCESSFUL: ${email}\n`);
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password (Generates Token)
// @route   POST /api/auth/forgotpassword
// @access  Public
// @desc    Debug Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log("1. Request received for email:", email); // Debug Log 1

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("2. User not found"); // Debug Log 2
      return res.status(404).json({ message: "No user found with this email" });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
    await user.save({ validateBeforeSave: false });
    
    console.log("3. Token saved to DB"); // Debug Log 3

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `Reset your password here: \n\n ${resetUrl}`;

    try {
      console.log("4. Attempting to send email..."); // Debug Log 4
      
      // Check if Env Vars are loaded
      if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        throw new Error("MISSING .ENV VARIABLES: SMTP_EMAIL or SMTP_PASSWORD is empty!");
      }

      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
      });

      console.log("5. Email sent successfully!"); // Debug Log 5
      res.status(200).json({ success: true, data: "Email sent!" });
    } catch (error) {
      console.error("❌ EMAIL SENDING FAILED:", error.message); // <--- THIS WILL TELL US THE ERROR
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      // Send the ACTUAL error message to the frontend
return res.status(500).json({ message: error.message });
    }
  } catch (error) {
    console.error("❌ SERVER CRASH:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password (Saves New Password)
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        // Set new password (REMOVED MANUAL HASHING HERE)
        // The Model will automatically hash this when we call .save()
        user.password = req.body.password; 
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful!" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
// Inside updateProfile function...
// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  console.log("---------------------------------------");
  console.log("📥 PROFILE UPDATE REQUEST RECEIVED");
  
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update basic fields
      user.name = req.body.name || user.name;
      user.headline = req.body.headline || user.headline;
      user.bio = req.body.bio || user.bio;
      user.experience = req.body.experience || user.experience;

      // Handle Skills (convert string back to array if needed)
      if (req.body.skills) {
        user.skills = req.body.skills.split(',').map(skill => skill.trim());
      }

      // Handle Avatar Image
      if (req.file) {
        user.avatar = `http://localhost:5000/uploads/${req.file.filename}`;
      }

      // Handle Password update (if provided)
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      console.log("✅ SAVED SUCCESSFULLY in DB");

      // 👇 THE CRITICAL FIX: Send back the full object
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        headline: updatedUser.headline,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        experience: updatedUser.experience,
        avatar: updatedUser.avatar,
        walletBalance: updatedUser.walletBalance,
        // We don't send a new token here to prevent session issues
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("❌ CRASH:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, getMe, updateProfile, getUserById };