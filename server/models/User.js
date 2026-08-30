// models/User.js
// Staff/admin accounts. Passwords are hashed with bcrypt before saving —
// the plain-text password is never stored or exposed to the frontend.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // hashed, never returned in API responses
    role: { type: String, enum: ["department", "admin"], required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it's set/changed.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash if a user document is ever sent as JSON.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
