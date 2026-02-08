import ConsultationModel from "../models/Consultation.js";
import UserModel from "../models/User.js";
import LawyerModel from "../models/Lawyer.js";

/**
 * Mark consultations as completed when their date+time has passed (status: accepted).
 * Call before returning lawyer or client consultation lists.
 */
async function markPastConsultationsCompleted() {
  const accepted = await ConsultationModel.find({
    status: "accepted",
  });
  const now = new Date();
  for (const c of accepted) {
    const d = new Date(c.date);
    const parts = String(c.time || "00:00").trim().split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    d.setHours(hours, minutes, 0, 0);
    if (d <= now) {
      await ConsultationModel.findByIdAndUpdate(c._id, {
        status: "completed",
      });
    }
  }
}

/**
 * @desc    Get all consultations for a lawyer
 * @route   GET /api/lawyers/:id/consultations
 * @access  Private/Lawyer
 */
export const getLawyerConsultations = async (req, res) => {
  try {
    await markPastConsultationsCompleted();

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

    // Format consultations (legacy "rescheduled" shown as "accepted")
    const formattedConsultations = consultations.map((consultation) => {
      const client = consultation.client;
      const status = consultation.status === "rescheduled" ? "accepted" : consultation.status;
      return {
        id: consultation._id,
        date: consultation.date,
        time: consultation.time,
        type: consultation.type,
        notes: consultation.notes,
        status,
        paid: consultation.paid ?? false,
        message: consultation.message,
        client: client
          ? {
              id: client._id,
              name: client.name,
              email: client.email,
              profileImage: client.profileImage,
            }
          : { id: null, name: "Unknown", email: "", profileImage: null },
        rescheduleRequests: consultation.rescheduleRequests || [],
        createdAt: consultation.createdAt,
      };
    });

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
    await markPastConsultationsCompleted();

    // Get consultations for the logged-in client (populate lawyer with consultationFee for payment)
    const consultations = await ConsultationModel.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "lawyer",
        select: "consultationFee user",
        populate: {
          path: "user",
          select: "name email profileImage",
        },
      });

    // Format consultations (legacy "rescheduled" shown as "accepted")
    const formattedConsultations = consultations.map((consultation) => {
      const status = consultation.status === "rescheduled" ? "accepted" : consultation.status;
      return {
      id: consultation._id,
      date: consultation.date,
      time: consultation.time,
      type: consultation.type,
      notes: consultation.notes,
      status,
      message: consultation.message,
      lawyer: {
        id: consultation.lawyer._id,
        name: consultation.lawyer.user.name,
        profileImage: consultation.lawyer.user.profileImage,
        consultationFee: consultation.lawyer.consultationFee ?? 0,
      },
      paid: consultation.paid ?? false,
      rescheduleRequests: consultation.rescheduleRequests || [],
      createdAt: consultation.createdAt,
    };
    });

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

    consultation.status = status;
    if (status === "accepted") consultation.unreadByClient = true;
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
 * @desc    Cancel consultation (lawyer or client)
 * @route   PUT /api/consultations/:id/cancel
 * @access  Private
 */
export const cancelConsultation = async (req, res) => {
  try {
    const consultation = await ConsultationModel.findById(
      req.params.id
    ).populate({ path: "lawyer" });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    const isLawyer = consultation.lawyer.user.toString() === req.user.id;
    const isClient = consultation.client.toString() === req.user.id;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this consultation",
      });
    }

    if (!["pending", "accepted"].includes(consultation.status)) {
      return res.status(400).json({
        success: false,
        message: "Consultation cannot be cancelled in its current status",
      });
    }

    // User cancelling an unpaid consultation: delete the record
    if (isClient && !consultation.paid) {
      await ConsultationModel.findByIdAndDelete(consultation._id);
      return res.json({
        success: true,
        message: "Consultation cancelled and removed.",
      });
    }

    consultation.status = "cancelled";
    if (isLawyer) consultation.unreadByClient = true;
    await consultation.save();

    res.json({
      success: true,
      data: { status: consultation.status },
      message: "Consultation cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel consultation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Reschedule consultation (only once, only paid consultations)
 * Lawyer: updates date/time, status stays accepted.
 * Client: proposes new date/time, status = pending; lawyer must accept again.
 * @route   PUT /api/consultations/:id/reschedule
 * @access  Private
 */
export const rescheduleConsultation = async (req, res) => {
  try {
    const { date, time, message } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Date and time are required for rescheduling",
      });
    }

    const consultation = await ConsultationModel.findById(
      req.params.id
    ).populate({ path: "lawyer" });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    if (!consultation.paid) {
      return res.status(400).json({
        success: false,
        message: "Only paid consultations can be rescheduled",
      });
    }

    if (!["pending", "accepted"].includes(consultation.status)) {
      return res.status(400).json({
        success: false,
        message: "Consultation cannot be rescheduled in its current status",
      });
    }

    if ((consultation.rescheduleRequests || []).length >= 1) {
      return res.status(400).json({
        success: false,
        message: "Only one reschedule is allowed per consultation",
      });
    }

    const isLawyer = consultation.lawyer.user.toString() === req.user.id;
    const isClient = consultation.client.toString() === req.user.id;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reschedule this consultation",
      });
    }

    const newDate = new Date(date);
    consultation.rescheduleRequests.push({
      date: newDate,
      time,
      message: message || "",
      requestedBy: req.user.id,
    });

    consultation.date = newDate;
    consultation.time = time;
    consultation.message = message || (isLawyer ? "Reschedule requested by lawyer." : "Reschedule requested by client.");

    if (isLawyer) {
      consultation.status = "accepted";
      consultation.unreadByClient = true;
    } else {
      consultation.status = "pending";
    }

    await consultation.save();

    res.json({
      success: true,
      data: { status: consultation.status, date: consultation.date, time: consultation.time },
      message: isLawyer
        ? "Reschedule sent. User will see the new date/time."
        : "Reschedule requested. Lawyer will need to accept the new time.",
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

/**
 * @desc    Get count of consultations with unread updates for the client
 * @route   GET /api/users/consultations/unread-count
 * @access  Private
 */
export const getClientUnreadCount = async (req, res) => {
  try {
    const count = await ConsultationModel.countDocuments({
      client: req.user.id,
      unreadByClient: true,
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error("Get client unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Mark all client consultations as read
 * @route   POST /api/users/consultations/mark-read
 * @access  Private
 */
export const markClientConsultationsRead = async (req, res) => {
  try {
    await ConsultationModel.updateMany(
      { client: req.user.id },
      { unreadByClient: false }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark consultations read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
