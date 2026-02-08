import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../models/User.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

const demoUsers = [
  {
    name: "Amit Patel",
    email: "amit.patel@example.com",
    password: "password123",
    mobile: "+91-9823456701",
    location: "Mumbai, Maharashtra",
    bio: "Small business owner seeking legal advice for business contracts and disputes.",
    profileImage: "default-profile.png",
  },
  {
    name: "Sneha Iyer",
    email: "sneha.iyer@example.com",
    password: "password123",
    mobile: "+91-9823456702",
    location: "Bangalore, Karnataka",
    bio: "Software engineer looking for advice on employment contracts and tenant rights.",
    profileImage: "default-profile.png",
  },
  {
    name: "Rahul Mehta",
    email: "rahul.mehta@example.com",
    password: "password123",
    mobile: "+91-9823456703",
    location: "Delhi, NCR",
    bio: "Entrepreneur needing consultation on immigration and business law.",
    profileImage: "default-profile.png",
  },
  {
    name: "Kavita Deshmukh",
    email: "kavita.deshmukh@example.com",
    password: "password123",
    mobile: "+91-9823456704",
    location: "Pune, Maharashtra",
    bio: "Teacher seeking help with family law matters and property disputes.",
    profileImage: "default-profile.png",
  },
  {
    name: "Sanjay Kumar",
    email: "sanjay.kumar@example.com",
    password: "password123",
    mobile: "+91-9823456705",
    location: "Mumbai, Maharashtra",
    bio: "Factory worker looking for assistance with labor rights and consumer protection.",
    profileImage: "default-profile.png",
  },
  {
    name: "Pooja Sharma",
    email: "pooja.sharma@example.com",
    password: "password123",
    mobile: "+91-9823456706",
    location: "Chennai, Tamil Nadu",
    bio: "Freelance designer needing advice on contracts and intellectual property.",
    profileImage: "default-profile.png",
  },
  {
    name: "Vikash Singh",
    email: "vikash.singh@example.com",
    password: "password123",
    mobile: "+91-9823456707",
    location: "Kolkata, West Bengal",
    bio: "Retail shop owner seeking consultation on tenant rights and business disputes.",
    profileImage: "default-profile.png",
  },
  {
    name: "Anjali Menon",
    email: "anjali.menon@example.com",
    password: "password123",
    mobile: "+91-9823456708",
    location: "Mumbai, Maharashtra",
    bio: "Healthcare professional looking for advice on employment law and contracts.",
    profileImage: "default-profile.png",
  },
  {
    name: "Deepak Rao",
    email: "deepak.rao@example.com",
    password: "password123",
    mobile: "+91-9823456709",
    location: "Hyderabad, Telangana",
    bio: "IT consultant needing help with consumer protection and civil rights issues.",
    profileImage: "default-profile.png",
  },
  {
    name: "Priyanka Joshi",
    email: "priyanka.joshi@example.com",
    password: "password123",
    mobile: "+91-9823456710",
    location: "Mumbai, Maharashtra",
    bio: "Marketing professional seeking legal advice on family law and property matters.",
    profileImage: "default-profile.png",
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Delete existing demo users
    await UserModel.deleteMany({
      email: { $in: demoUsers.map((u) => u.email) },
    });
    console.log("Cleared existing demo users");

    const createdUsers = [];

    for (const userData of demoUsers) {
      try {
        const user = await UserModel.create({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          mobile: userData.mobile,
          location: userData.location,
          bio: userData.bio,
          profileImage: userData.profileImage,
          role: "user",
        });

        createdUsers.push({
          name: userData.name,
          email: userData.email,
          location: userData.location,
        });
      } catch (error) {
        console.error(`Error creating user ${userData.name}:`, error.message);
      }
    }

    console.log(`\n✓ Seeded ${createdUsers.length} demo users successfully!`);
    console.log("\nUser Details:");
    createdUsers.forEach((user, index) => {
      console.log(`\n[${index + 1}] ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Location: ${user.location}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
