const Application = require("../models/applicationModel");
const Contract = require("../models/contract");
const Job = require("../models/job");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");


exports.applyJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    // 1. Find job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    // 1.5. Check if Job status is 'open' - prevent applying to in-progress or completed jobs
    if (job.status !== 'open') {
      return res.status(400).json({ 
        success: false,
        message: `This job is no longer available for applications. Current status: ${job.status}` 
      });
    }

    // 2. Check if already applied
    const existing = await Contract.findOne({ jobId, freelancerId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already applied to this job" });
    }

    // 3. Create contract instead of application
    const contract = await Contract.create({
      jobId,
      clientId: job.postedBy,
      freelancerId: req.user._id,
      amount: job.budget,
      terms: coverLetter || "Standard application terms",
      status: 'pending'
    });

    // 4. Populate and return
    await contract.populate('jobId freelancerId', 'title budget name email');

    // 5. Notify client
    const client = await User.findById(job.postedBy);
    const freelancer = await User.findById(req.user._id);
    
    await sendEmail({
      email: client.email,
      subject: 'New Freelancer Application',
      message: `Freelancer ${freelancer.name} has applied to your job "${job.title}".`
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: contract
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get all pending contracts for this job (applications)
    const applications = await Contract.find({ 
      jobId, 
      status: 'pending' 
    })
      .populate("freelancerId", "name email experience skills rating avatar")
      .populate("jobId", "title description budget");

    res.status(200).json({
      success: true,
      applications
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contractId = req.params.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'accepted' or 'rejected'"
      });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Only client can update application status
    if (contract.clientId.toString() !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this application"
      });
    }

    if (contract.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Application already processed"
      });
    }

    // Update contract status
    if (status === 'accepted') {
      contract.status = 'new'; // Ready for funding
    } else if (status === 'rejected') {
      contract.status = 'cancelled';
    }

    await contract.save();

    // Notify freelancer
    const freelancer = await User.findById(contract.freelancerId);
    const statusMessage = status === 'accepted' 
      ? 'Your application has been accepted!' 
      : 'Unfortunately, your application was not accepted this time.';

    await sendEmail({
      email: freelancer.email,
      subject: `Application ${status}`,
      message: statusMessage
    });

    res.status(200).json({
      success: true,
      message: `Application ${status}`,
      application: contract
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};