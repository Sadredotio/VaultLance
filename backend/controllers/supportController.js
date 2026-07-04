const sendContactMessage = async (req, res) => {
    try {
      const { name, email, message } = req.body;
  
      if (!name || !email || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      // Option A: save it to your database for now
      // await SupportMessage.create({ name, email, message });
  
      // Option B: actually email it to yourself (Nodemailer, optional)
      // await sendEmail({ name, email, message });
  
      console.log("New support query:", { name, email, message });
  
      res.status(200).json({ message: "Message received" });
    } catch (error) {
      console.error("Support contact error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  module.exports = { sendContactMessage };