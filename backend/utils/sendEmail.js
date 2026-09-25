const sendEmail = require("../utils/sendEmail");

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await sendEmail({
      email: process.env.SMTP_EMAIL,
      subject: `VaultLance Support Query from ${name}`,
      message: `Name: ${name}\nEmail: ${email}\n\nQuery:\n${message}`,
    });

    console.log("New support query:", { name, email, message });
    res.status(200).json({ message: "Message received" });
  } catch (error) {
    console.error("Support contact error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { sendContactMessage };