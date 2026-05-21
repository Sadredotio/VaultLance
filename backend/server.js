const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ✅ Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

if (!process.env.MONGO_URl) {
  console.error('❌ CRITICAL: MONGO_URl is not defined in .env file');
  process.exit(1);
}

console.log('✅ All critical environment variables are set');

const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const contractRoutes = require('./routes/contractRoutes');
const applicationRoutes = require("./routes/applicationRoutes");
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const disputeRoutes = require('./routes/disputeRoutes');



const app = express();

// Middleware
app.use(express.json()); // Allows us to send JSON data
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database Connection
mongoose.connect(process.env.MONGO_URl)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Basic Route
app.get('/', (req, res) => {
  res.send("Escrow API is Running...");
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/contracts', contractRoutes); 
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/applications", applicationRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});