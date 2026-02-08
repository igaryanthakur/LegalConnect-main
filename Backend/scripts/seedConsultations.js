import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../models/User.js";
import LawyerModel from "../models/Lawyer.js";
import ConsultationModel from "../models/Consultation.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

// Helper function to generate random date within a range
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Helper function to generate random time
function randomTime() {
  const hours = Math.floor(Math.random() * 9) + 9; // 9 AM to 5 PM
  const minutes = Math.random() > 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Consultation templates with varied scenarios
const consultationScenarios = [
  {
    type: "video",
    notes:
      "Need advice on tenant eviction notice. Landlord asking me to vacate without proper notice period.",
    message: "Urgent consultation needed regarding housing rights.",
  },
  {
    type: "phone",
    notes:
      "Consultation regarding employment contract termination and severance package.",
    message: "Want to discuss my rights after sudden job termination.",
  },
  {
    type: "in-person",
    notes:
      "Family dispute over property inheritance. Need help with legal documentation.",
    message: "Looking for guidance on property division among siblings.",
  },
  {
    type: "video",
    notes:
      "Consumer complaint against online retailer for defective product and refused refund.",
    message: "Need help filing consumer complaint.",
  },
  {
    type: "phone",
    notes:
      "Immigration visa application rejected. Want to understand appeal process.",
    message: "Seeking advice on visa rejection and next steps.",
  },
  {
    type: "in-person",
    notes:
      "Divorce proceedings - need consultation on custody and alimony matters.",
    message: "Family law consultation for divorce case.",
  },
  {
    type: "video",
    notes:
      "Workplace discrimination and harassment issues. Want to file formal complaint.",
    message: "Need legal advice on workplace harassment.",
  },
  {
    type: "phone",
    notes:
      "Small business contract review before signing agreement with vendor.",
    message: "Business contract review needed urgently.",
  },
  {
    type: "in-person",
    notes:
      "Criminal charges filed against me. Need defense counsel consultation.",
    message: "Urgent: Need criminal defense advice.",
  },
  {
    type: "video",
    notes: "Neighbor dispute over property boundary and illegal construction.",
    message: "Civil dispute with neighbor needs resolution.",
  },
  {
    type: "phone",
    notes:
      "Medical negligence case - want to understand legal options for compensation.",
    message: "Consultation regarding medical malpractice claim.",
  },
  {
    type: "in-person",
    notes:
      "Traffic accident case - need help with insurance claim and liability issues.",
    message: "Accident claim consultation required.",
  },
  {
    type: "video",
    notes:
      "Employment contract has non-compete clause. Want to change jobs but concerned.",
    message: "Need clarity on non-compete agreement implications.",
  },
  {
    type: "phone",
    notes:
      "Cheque bounce case - creditor threatening legal action. Need defense strategy.",
    message: "Legal help needed for cheque dishonor notice.",
  },
  {
    type: "in-person",
    notes:
      "Property purchase - need legal verification of documents and title search.",
    message: "Property due diligence consultation.",
  },
  {
    type: "video",
    notes:
      "Defamation on social media - someone posting false information about my business.",
    message: "Cyber law consultation for defamation case.",
  },
  {
    type: "phone",
    notes:
      "Tax dispute with income tax department. Received notice for reassessment.",
    message: "Tax litigation advice needed.",
  },
  {
    type: "in-person",
    notes: "Will and testament drafting for estate planning purposes.",
    message: "Estate planning consultation.",
  },
  {
    type: "video",
    notes:
      "Partnership business dissolution - need advice on exit process and asset division.",
    message: "Business partnership dissolution consultation.",
  },
  {
    type: "phone",
    notes: "Student education loan default - bank threatening recovery action.",
    message: "Loan settlement and negotiation help needed.",
  },
  {
    type: "in-person",
    notes: "Adoption process legal requirements and documentation assistance.",
    message: "Family law - adoption procedure guidance.",
  },
  {
    type: "video",
    notes:
      "Builder delayed property possession beyond agreement date. Want compensation.",
    message: "Real estate dispute - builder delay case.",
  },
  {
    type: "phone",
    notes:
      "Copyright infringement - my creative work used without permission commercially.",
    message: "Intellectual property rights consultation.",
  },
  {
    type: "in-person",
    notes: "Bail application for relative arrested in criminal case.",
    message: "Criminal law - bail application assistance.",
  },
  {
    type: "video",
    notes:
      "Insurance claim rejected for health treatment. Policy coverage dispute.",
    message: "Insurance claim dispute resolution.",
  },
  {
    type: "phone",
    notes:
      "Matrimonial dispute - domestic violence and protection order needed.",
    message: "Urgent help for domestic violence case.",
  },
  {
    type: "in-person",
    notes:
      "RTI application response delayed. Need legal remedy for information access.",
    message: "RTI and transparency law consultation.",
  },
  {
    type: "video",
    notes:
      "Employment termination during maternity leave. Believe this is discrimination.",
    message: "Labor rights violation - maternity protection.",
  },
  {
    type: "phone",
    notes:
      "Credit card fraud - unauthorized transactions. Bank refusing to help.",
    message: "Banking fraud case legal assistance.",
  },
  {
    type: "in-person",
    notes:
      "Pension benefits dispute with former employer. Retirement dues not paid.",
    message: "Employment benefits and pension rights.",
  },
];

async function seedConsultations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Fetch all lawyers with their user references
    const lawyers = await LawyerModel.find({ isVerified: true }).populate(
      "user",
    );
    if (lawyers.length === 0) {
      console.log("❌ No lawyers found. Please run seedDemoLawyers.js first.");
      process.exit(1);
    }

    // Fetch all demo users (clients)
    const clients = await UserModel.find({ role: "user" });
    if (clients.length === 0) {
      console.log("❌ No users found. Please run seedDemoUsers.js first.");
      process.exit(1);
    }

    // Clear existing consultations
    await ConsultationModel.deleteMany({});
    console.log("Cleared existing consultations");

    const consultationStatuses = [
      { status: "pending", paid: false },
      { status: "pending", paid: false },
      { status: "pending", paid: true },
      { status: "accepted", paid: false },
      { status: "accepted", paid: false },
      { status: "accepted", paid: true },
      { status: "accepted", paid: true },
      { status: "accepted", paid: true },
      { status: "completed", paid: true },
      { status: "completed", paid: true },
      { status: "completed", paid: true },
      { status: "completed", paid: true },
      { status: "completed", paid: true },
      { status: "rejected", paid: false },
      { status: "rejected", paid: false },
      { status: "cancelled", paid: false },
      { status: "cancelled", paid: true },
    ];

    const createdConsultations = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create 25 consultations with various statuses
    for (let i = 0; i < 25; i++) {
      const scenario = consultationScenarios[i % consultationScenarios.length];
      const statusConfig =
        consultationStatuses[i % consultationStatuses.length];
      const lawyer = lawyers[i % lawyers.length];
      const client = clients[i % clients.length];

      // Determine date based on status
      let scheduledDate;
      if (
        statusConfig.status === "completed" ||
        statusConfig.status === "rejected" ||
        statusConfig.status === "cancelled"
      ) {
        // Past dates for completed/rejected/cancelled
        scheduledDate = randomDate(thirtyDaysAgo, now);
      } else if (statusConfig.status === "accepted") {
        // Mix of past and future for accepted
        scheduledDate =
          i % 2 === 0
            ? randomDate(now, thirtyDaysLater)
            : randomDate(thirtyDaysAgo, now);
      } else {
        // Future dates for pending
        scheduledDate = randomDate(now, thirtyDaysLater);
      }

      const time = randomTime();
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(parseInt(time.split(":")[0]));
      scheduledDateTime.setMinutes(parseInt(time.split(":")[1]));

      // Build consultation object
      const consultationData = {
        lawyer: lawyer._id,
        client: client._id,
        scheduledDateTime: scheduledDateTime,
        date: scheduledDate,
        time: time,
        type: scenario.type,
        notes: scenario.notes,
        message: scenario.message,
        status: statusConfig.status,
        paid: statusConfig.paid,
        unreadByClient:
          statusConfig.status === "accepted" && Math.random() > 0.5,
      };

      // Add payment details only for paid consultations
      if (statusConfig.paid) {
        consultationData.paymentDetails = {
          razorpayOrderId: `order_${Math.random().toString(36).substr(2, 9)}`,
          razorpayPaymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
          razorpaySignature: Math.random().toString(36).substr(2, 20),
          amount: lawyer.consultationFee || 1000,
          currency: "INR",
          status: "success",
          paidAt: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // Paid 1 day before
        };
      }

      try {
        const consultation = await ConsultationModel.create(consultationData);

        createdConsultations.push({
          id: consultation._id,
          client: client.name,
          lawyer: lawyer.user.name,
          date: scheduledDate.toLocaleDateString(),
          time: time,
          type: scenario.type,
          status: statusConfig.status,
          paid: statusConfig.paid,
          fee: lawyer.consultationFee || 0,
        });
      } catch (error) {
        console.error(`Error creating consultation ${i + 1}:`, error.message);
      }
    }

    console.log(
      `\n✓ Seeded ${createdConsultations.length} consultations successfully!`,
    );
    console.log("\nConsultation Summary:");

    // Group by status
    const statusGroups = createdConsultations.reduce((acc, c) => {
      if (!acc[c.status]) acc[c.status] = [];
      acc[c.status].push(c);
      return acc;
    }, {});

    Object.keys(statusGroups).forEach((status) => {
      const consultations = statusGroups[status];
      const paidCount = consultations.filter((c) => c.paid).length;
      console.log(`\n${status.toUpperCase()}: ${consultations.length} total`);
      console.log(`  - Paid: ${paidCount}`);
      console.log(`  - Unpaid: ${consultations.length - paidCount}`);
    });

    console.log("\n\nSample Consultations:");
    createdConsultations.slice(0, 5).forEach((c, index) => {
      console.log(`\n[${index + 1}] ${c.client} → ${c.lawyer}`);
      console.log(`    Date: ${c.date} at ${c.time}`);
      console.log(`    Type: ${c.type} | Status: ${c.status}`);
      console.log(`    Payment: ${c.paid ? `Paid ₹${c.fee}` : "Unpaid"}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding consultations:", error);
    process.exit(1);
  }
}

seedConsultations();
