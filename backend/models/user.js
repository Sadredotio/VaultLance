const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Profile Fields
  headline: { type: String, default: "" },
  bio: { type: String, default: "" },
  skills: { type: [String], default: [] },
  experience: { type: String, default: "" }, // Work experience description
  rating: { type: Number, default: 0 }, // Work quality rating
  avatar: { 
    type: String, 
    default: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
  },

  role: { type: String, enum: ['client', 'freelancer'], required: true },
  
  // 👇 YOU WERE MISSING THIS FIELD!
  walletBalance: { type: Number, default: 0 },

  // Reset Password Fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  try {
    const user = this;
    
    console.log(`\n🔐 PRE-SAVE HOOK: Email=${user.email}`);
    
    // Only hash if password is modified
    if (!user.isModified('password')) {
      console.log(`⏭️ Password not modified, skipping hash`);
      return; // Just return, don't call next()
    }

    console.log(`🔑 Original password length: ${user.password.length}`);
    console.log(`🔑 Original password (first 10 chars): ${user.password.substring(0, 10)}`);

    // Hash password using bcryptjs
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`✅ Password hashed successfully`);
    console.log(`✅ Hash: ${hash.substring(0, 20)}... (${hash.length} chars)`);
    
    user.password = hash;
    // Don't call next() - just return and let Mongoose handle it
  } catch (error) {
    console.error(`❌ Hashing error: ${error.message}`);
    throw error; // Throw instead of next(error)
  }
});
      
module.exports = mongoose.models.User || mongoose.model('User', userSchema);