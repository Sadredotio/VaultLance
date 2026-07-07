const path = require("path");
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { trackUser } = require('./middleware/trackVisitor');
const { protect } = require('./middleware/authMiddleware');

require("dotenv").config();

const session = require("express-session");
const passport = require("passport");

  require("./config/passport");

// Validate Environment Variables
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing in .env");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("❌ GOOGLE_CLIENT_ID is missing in .env");
  process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("❌ GOOGLE_CLIENT_SECRET is missing in .env");
  process.exit(1);
}

console.log("✅ Environment variables loaded successfully");

// Import Routes
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const contractRoutes = require("./routes/contractRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const supportRoutes = require("./routes/supportRoutes.js")
const adminRoutes = require("./routes/adminRoutes");
const walletWebhookRoute = require("./routes/walletWebhookRoute");
const initSocket = require("./sockets/socket");


// Express App
const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL, // your deployed frontend, e.g. https://vaultlance.vercel.app
  "http://localhost:5173", // local Vite dev server
  "http://localhost:3000"  // in case you ever run frontend on this port too
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());


app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error");
    console.error(err);
  });

// Static Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic Route
app.get("/", (req, res) => {
  res.send("🚀 VaultLance API Running...");
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/jobs', protect, trackUser, jobRoutes);


app.use(
  "/api/wallet/webhook",
  express.raw({ type: "application/json" }),
  walletWebhookRoute
);
app.use(express.json());

// HTTP Server + Socket.io
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = initSocket(httpServer);

app.set("io", io);

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💬 Socket.io ready`);
});