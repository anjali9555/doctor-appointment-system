import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import UserModel from "../models/userModel.js";
import DoctorModel from "../models/doctorModel.js";
import KnowledgeBaseModel from "../models/knowledgeBaseModel.js";

dotenv.config();

const sampleDoctors = [
  {
    name: "Dr. Sarah Mitchell",
    speciality: "Cardiologist",
    degree: "MBBS, MD - Cardiology (AIIMS)",
    experience: 12,
    fees: 800,
    email: "sarah.mitchell@medicare.local",
    phone: "+91 98765 43210",
    address: "Suite 401, MediCare Specialty Tower",
    about: "Dr. Sarah Mitchell is a senior interventional cardiologist specializing in cardiovascular prevention, heart failure management, and hypertension.",
    available: true,
    rating: 4.9,
    numReviews: 24,
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "09:00", end: "16:00" },
    slotDuration: 30,
    breakTimes: [{ start: "13:00", end: "14:00" }],
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Dr. Rajesh Sharma",
    speciality: "Dermatologist",
    degree: "MBBS, DVD, MD - Dermatology",
    experience: 9,
    fees: 600,
    email: "rajesh.sharma@medicare.local",
    phone: "+91 98765 43211",
    address: "Room 205, DermaCare Wing",
    about: "Expert in clinical dermatology, acne therapies, allergic conditions, and modern cosmetic skin rejuvenation.",
    available: true,
    rating: 4.8,
    numReviews: 18,
    workingDays: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "10:00", end: "17:00" },
    slotDuration: 30,
    breakTimes: [{ start: "13:00", end: "14:00" }],
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Dr. Elena Rostova",
    speciality: "Pediatrician",
    degree: "MBBS, DCH, MD - Pediatrics",
    experience: 14,
    fees: 700,
    email: "elena.rostova@medicare.local",
    phone: "+91 98765 43212",
    address: "Children's Health Clinic, Block B",
    about: "Compassionate pediatrician dedicated to infant growth monitoring, childhood immunization, and pediatric allergy treatment.",
    available: true,
    rating: 4.9,
    numReviews: 31,
    workingDays: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
    workingHours: { start: "09:00", end: "15:00" },
    slotDuration: 30,
    breakTimes: [{ start: "12:30", end: "13:30" }],
    image: "https://images.unsplash.com/photo-1594824813587-0b1a030438cf?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Dr. Arvind Menon",
    speciality: "Orthopedic",
    degree: "MBBS, MS - Orthopedics, Fellowship Joint Replacement",
    experience: 16,
    fees: 900,
    email: "arvind.menon@medicare.local",
    phone: "+91 98765 43213",
    address: "Ortho & Joint Institute, Level 3",
    about: "Specialist in joint replacements, sports injury rehabilitation, spine health, and arthroscopic knee surgery.",
    available: true,
    rating: 4.7,
    numReviews: 29,
    workingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "11:00", end: "18:00" },
    slotDuration: 30,
    breakTimes: [{ start: "14:00", end: "15:00" }],
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
  },
];

const seedData = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
    if (!mongoUrl) {
      console.error("MONGO_URL not found in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB for Seeding...".cyan);

    // 1. Seed Admin User
    const adminEmail = "admin@medicare.com";
    let admin = await UserModel.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@123456", salt);
      admin = await UserModel.create({
        name: "Clinic Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isAdmin: true,
        phone: "+91 99999 88888",
        address: "MediCare Administration Suite",
      });
      console.log("✓ Default Admin created: admin@medicare.com / Admin@123456".green);
    } else {
      console.log("Admin account already present.".gray);
    }

    // 2. Seed Demo Patient User
    const patientEmail = "patient@medicare.com";
    let patient = await UserModel.findOne({ email: patientEmail });
    if (!patient) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Patient@123456", salt);
      patient = await UserModel.create({
        name: "John Patient",
        email: patientEmail,
        password: hashedPassword,
        role: "patient",
        isAdmin: false,
        phone: "+91 98888 77777",
        address: "221B Baker Street, Healthcare Colony",
        gender: "male",
      });
      console.log("✓ Demo Patient created: patient@medicare.com / Patient@123456".green);
    }

    // 3. Seed Sample Doctors
    for (const doc of sampleDoctors) {
      const existing = await DoctorModel.findOne({ email: doc.email });
      if (!existing) {
        await DoctorModel.create(doc);
        console.log(`✓ Doctor created: ${doc.name} (${doc.speciality})`.green);
      }
    }

    // 4. Seed Knowledge Base Articles
    const articles = [
      {
        title: "Clinic Working Hours & Location",
        category: "general",
        content: "MediCare Outpatient Clinic is open Monday through Saturday from 9:00 AM to 5:00 PM. Emergency triage operates 24/7. Address: MediCare Plaza, Healthcare Avenue.",
        tags: ["timings", "hours", "location", "address", "open"],
      },
      {
        title: "Appointment Booking Process",
        category: "appointment",
        content: "To book an appointment: Navigate to Doctors, select your specialist, choose an available date from their live schedule, pick a genuine open time slot, and confirm. Your booking is instantaneously confirmed.",
        tags: ["booking", "schedule", "how to book", "slots"],
      },
      {
        title: "Cancellation & Rescheduling Policy",
        category: "policy",
        content: "Appointments can be cancelled or rescheduled up to 2 hours prior to the booked time slot directly from 'My Appointments'. Refunds for online payments are processed within 3-5 business days.",
        tags: ["cancellation", "refund", "cancel", "reschedule", "policy"],
      },
      {
        title: "Doctor Consultation Fees & Pricing",
        category: "policy",
        content: "Consultation fees range from ₹600 to ₹900 depending on the specialist's experience and department. Fees are authoritative and calculated strictly by the clinic database.",
        tags: ["fees", "cost", "price", "charges"],
      },
    ];

    for (const art of articles) {
      const existing = await KnowledgeBaseModel.findOne({ title: art.title });
      if (!existing) {
        await KnowledgeBaseModel.create(art);
        console.log(`✓ Knowledge article seeded: ${art.title}`.green);
      }
    }

    console.log("Database seeding completed successfully!".green.bold);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:".red, error);
    process.exit(1);
  }
};

seedData();
