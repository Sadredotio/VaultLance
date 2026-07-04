const express = require("express");
const { sendContactMessage } = require("../controllers/supportController");

const router = express.Router();

router.post("/contact", sendContactMessage);

module.exports = router;