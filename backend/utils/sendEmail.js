const sendEmail = async (options) => {
    // Instead of sending a real email, we just log it to the console
    console.log("========================================");
    console.log("📧 MOCK EMAIL SERVICE");
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.message}`);
    console.log("========================================");
  };
  
  module.exports = sendEmail;