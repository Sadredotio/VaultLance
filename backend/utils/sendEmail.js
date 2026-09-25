const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    throw new Error("Missing SMTP_EMAIL or SMTP_PASSWORD in environment variables.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `VaultLance <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject,
    text: message,
    html: `<p>${String(message).replace(/\n/g, "<br />")}</p>`,
  });
};

module.exports = sendEmail;