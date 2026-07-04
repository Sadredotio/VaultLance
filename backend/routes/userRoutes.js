const express = require("express");
const router = express.Router();

const passport = require("passport");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  getUserById,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// ==============================
// Multer Configuration
// ==============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `user-${req.user.id}-${Date.now()}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==============================
// Public Routes
// ==============================

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/forgotpassword", forgotPassword);

router.put("/resetpassword/:token", resetPassword);

// ==============================
// Google OAuth
// ==============================

// Redirect user to Google Login
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google Callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.redirect(
      `${process.env.CLIENT_URL}/oauth-success?token=${token}`
    );
  }
);

// GitHub Login
router.get(
  "/auth/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

// GitHub Callback
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.redirect(
      `${process.env.CLIENT_URL}/oauth-success?token=${token}`
    );
  }
);
// Protected Routes
router.get("/me", protect, getMe);

router.put(
  "/profile",
  protect,
  upload.single("avatar"),
  updateProfile
);

// User By ID
router.get("/:id", protect, getUserById);

module.exports = router;