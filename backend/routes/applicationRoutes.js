const express = require("express");
const router = express.Router();

const {
  applyJob,
  getJobApplications,
  updateApplicationStatus
} = require("../controllers/applicationController");

router.post("/apply", applyJob);

router.get("/job/:jobId", getJobApplications);

router.put("/status/:id", updateApplicationStatus);

module.exports = router;