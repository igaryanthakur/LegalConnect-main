/**
 * One-off script: create a paid consultation from user "Aryan Thakur" to lawyer "Lovely Rana".
 * Usage: node scripts/seedPaidConsultation.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import UserModel from "../models/User.js";
import LawyerModel from "../models/Lawyer.js";
import ConsultationModel from "../models/Consultation.js";

dotenv.config();

async function seedPaidConsultation() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("MONGODB_URI not set in .env");
      process.exit(1);
    }
    await mongoose.connect(mongoURI, { dbName: "legalconnect" });

    const client = await UserModel.findOne({
      name: /Aryan Thakur/i,
    });
    if (!client) {
      console.error('User "Aryan Thakur" not found. Create the user first or check the name.');
      process.exit(1);
    }

    const lawyers = await LawyerModel.find().populate("user", "name");
    const lovelyRana = lawyers.find(
      (l) => l.user && l.user.name && l.user.name.toLowerCase().includes("lovely")
    );
    if (!lovelyRana) {
      console.error('Lawyer "Lovely Rana" not found. Create the lawyer profile first.');
      process.exit(1);
    }

    const existing = await ConsultationModel.findOne({
      lawyer: lovelyRana._id,
      client: client._id,
    });
    if (existing) {
      await ConsultationModel.findByIdAndUpdate(existing._id, {
        status: "accepted",
        paid: true,
      });
      console.log(
        `Updated existing consultation ${existing._id} to status=accepted, paid=true.`
      );
    } else {
      const consultation = await ConsultationModel.create({
        lawyer: lovelyRana._id,
        client: client._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        time: "10:00",
        type: "video",
        notes: "Test consultation for Contact button",
        status: "accepted",
        paid: true,
      });
      console.log(
        `Created consultation ${consultation._id}: ${client.name} -> ${lovelyRana.user.name} (accepted, paid=true).`
      );
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedPaidConsultation();
