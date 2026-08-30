// seed.js
// Run with: npm run seed
// Creates the department documents and demo login accounts.
// Safe to run multiple times — it won't create duplicates.

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Department = require("./models/Department");
const User = require("./models/User");

const DEPARTMENTS = [
  "Water Department",
  "Electricity Department",
  "Roads & Infrastructure Department",
  "Sanitation Department",
  "General/Municipal Department",
];

// username -> { password, departmentName | null (null = admin) }
const DEMO_ACCOUNTS = [
  { username: "water_dept", password: "dept123", departmentName: "Water Department" },
  { username: "electricity_dept", password: "dept123", departmentName: "Electricity Department" },
  { username: "roads_dept", password: "dept123", departmentName: "Roads & Infrastructure Department" },
  { username: "sanitation_dept", password: "dept123", departmentName: "Sanitation Department" },
  { username: "general_dept", password: "dept123", departmentName: "General/Municipal Department" },
  { username: "admin", password: "admin123", departmentName: null }, // sees every department
];

async function seed() {
  await connectDB();

  console.log("Seeding departments...");
  const departmentDocs = {};
  for (const name of DEPARTMENTS) {
    const dept = await Department.findOneAndUpdate(
      { name },
      { name },
      { upsert: true, new: true }
    );
    departmentDocs[name] = dept;
    console.log(`  ✓ ${name}`);
  }

  console.log("Seeding demo accounts...");
  for (const acc of DEMO_ACCOUNTS) {
    const existing = await User.findOne({ username: acc.username });
    if (existing) {
      console.log(`  – ${acc.username} already exists, skipping`);
      continue;
    }
    await User.create({
      username: acc.username,
      password: acc.password, // hashed automatically by the User model's pre-save hook
      role: acc.departmentName ? "department" : "admin",
      department: acc.departmentName ? departmentDocs[acc.departmentName]._id : null,
    });
    console.log(`  ✓ ${acc.username} (password: ${acc.password})`);
  }

  console.log("\nDone. Demo credentials:");
  console.table(DEMO_ACCOUNTS.map(a => ({ username: a.username, password: a.password, role: a.departmentName || "admin (all departments)" })));

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
