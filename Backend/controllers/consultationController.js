import ConsultationModel from "../models/Consultation.js";
import UserModel from "../models/User.js";
import LawyerModel from "../models/Lawyer.js";

/**
 * @desc    Get all consultations for a lawyer
 * @route   GET /api/lawyers/:id/consultations
 * @access  Private/Lawyer
 */
export const getLawyerConsultations = async (req, res) => {
  try {
    // Verify that the logged-in user is the lawyer
    const lawyer = await LawyerModel.findById(req.params.id);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer profile not found",
      });
    }

    // Check if user is authorized to view these consultations
    if (lawyer.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these consultations",
      });
    }

    // Get consultations and populate client information
    const consultations = await ConsultationModel.find({
      lawyer: req.params.id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "client",
        select: "name email profileImage",
      });

    // Format consultations for the frontend
    const formattedConsultations = consultations.map((consultation) => ({
      id: consultation._id,
      date: consultation.date,
      time: consultation.time,
      type: consultation.type,
      notes: consultation.notes,
      status: consultation.status,
      message: consultation.message,
      client: {
        id: consultation.client._id,
        name: consultation.client.name,
        email: consultation.client.email,
        profileImage: consultation.client.profileImage,
      },
      createdAt: consultation.createdAt,
    }));

    res.json({
      success: true,
      count: formattedConsultations.length,
      data: formattedConsultations,
    });
  } catch (error) {
    console.error("Get lawyer consultations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all consultations for a client
 * @route   GET /api/users/consultations
 * @access  Private
 */
export const getClientConsultations = async (req, res) => {
  try {
    // Get consultations for the logged-in client
    const consultations = await ConsultationModel.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "lawyer",
        populate: {
          path: "user",
          select: "name email profileImage",
        },
      });

    // Format consultations for the frontend
    const formattedConsultations = consultations.map((consultation) => ({
      id: consultation._id,
      date: consultation.date,
      time: consultation.time,
      type: consultation.type,
      notes: consultation.notes,
      status: consultation.status,
      message: consultation.message,
      lawyer: {
        id: consultation.lawyer._id,
        name: consultation.lawyer.user.name,
        profileImage: consultation.lawyer.user.profileImage,
      },
      createdAt: consultation.createdAt,
    }));

    res.json({
      success: true,
      count: formattedConsultations.length,
      data: formattedConsultations,
    });
  } catch (error) {
    console.error("Get client consultations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Schedule a new consultation
 * @route   POST /api/lawyers/:id/consultations
 * @access  Private
 */
export const scheduleConsultation = async (req, res) => {
  try {
    const { date, time, type, notes } = req.body;

    // Validate required fields
    if (!date || !time || !type) {
      return res.status(400).json({
        success: false,
        message: "Date, time, and consultation type are required",
      });
    }

    // Check if lawyer exists
    const lawyer = await LawyerModel.findById(req.params.id);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    // Create new consultation
    const consultation = await ConsultationModel.create({
      lawyer: req.params.id,
      client: req.user.id,
      date,
      time,
      type,
      notes,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      data: consultation,
      message: "Consultation request submitted successfully",
    });
  } catch (error) {
    console.error("Schedule consultation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update consultation status
 * @route   PUT /api/consultations/:id
 * @access  Private/Lawyer
 */
export const updateConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Find consultation
    const consultation = await ConsultationModel.findById(
      req.params.id
    ).populate({
      path: "lawyer",
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Check if user is the lawyer for this consultation
    if (consultation.lawyer.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this consultation",
      });
    }

    // Update consultation status
    consultation.status = status;
    await consultation.save();

    res.json({
      success: true,
      data: { status: consultation.status },
      message: "Consultation status updated successfully",
    });
  } catch (error) {
    console.error("Update consultation status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Reschedule consultation
 * @route   PUT /api/consultations/:id/reschedule
 * @access  Private
 */
export const rescheduleConsultation = async (req, res) => {
  try {
    const { date, time, message } = req.body;

    // Validate required fields
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Date and time are required for rescheduling",
      });
    }

    // Find consultation
    const consultation = await ConsultationModel.findById(
      req.params.id
    ).populate({
      path: "lawyer",
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Check if user is the lawyer or client for this consultation
    const isLawyer = consultation.lawyer.user.toString() === req.user.id;
    const isClient = consultation.client.toString() === req.user.id;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reschedule this consultation",
      });
    }

    // Add reschedule request
    consultation.rescheduleRequests.push({
      date,
      time,
      message,
      requestedBy: req.user.id,
    });

    // Update status to rescheduled
    consultation.status = "rescheduled";
    consultation.message = message || "Reschedule requested.";

    await consultation.save();

    res.json({
      success: true,
      message: "Reschedule request submitted successfully",
    });
  } catch (error) {
    console.error("Reschedule consultation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
