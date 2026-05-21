const mongoose = require('mongoose');
const User = require('./models/User'); 
const bcrypt = require('bcryptjs');

const runFix = async () => {
  try {
    console.log("🚀 Starting Fix Script...");

    // 👇 PASTE YOUR MONGO URI DIRECTLY INSIDE THE QUOTES BELOW 👇
    // Example: "mongodb+srv://user:pass@cluster0.mongodb.net/myapp"
    const myMongoURI = "mongodb+srv://sheikhsadre27_db_user:U7WYDRYRjp0zu6fz@cluster0.bhutjvc.mongodb.net/Trust-lance"; 

    

    await mongoose.connect(myMongoURI);
    console.log("✅ Connected to DB");

    const email = "afsheen@gmail.com";
    const password = "afsheen@123";

    // 1. DELETE the old corrupted user
    await User.deleteOne({ email });
    console.log(`🗑️ Old user '${email}' deleted.`);

    // 2. CREATE the user fresh
    const newUser = await User.create({
      name: "Afsheen Test",
      email: email,
      password: password, 
      role: "client",
      walletBalance: 1000
    });

    console.log("🆕 New User Created.");

    // 3. IMMEDIATE TEST: Can we verify it?
    const isMatch = await bcrypt.compare(password, newUser.password);

    console.log("------------------------------------------------");
    console.log(`🧐 VERIFICATION TEST:`);
    if (isMatch) {
      console.log("✅ SUCCESS! The password logic is PERFECT.");
      console.log("👉 Restart your server and Login as 'afsheen@gmail.com' / 'afsheen@123'");
    } else {
      console.log("❌ FAILURE. The password was hashed twice.");
    }
    console.log("------------------------------------------------");

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

runFix();