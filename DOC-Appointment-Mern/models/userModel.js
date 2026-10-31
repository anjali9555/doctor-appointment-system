import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    image: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer not to say", "Male", "Female", "Other", ""],
      default: ""
    },
    role: {
      type: String,
      enum: ["patient", "admin", "doctor"],
      default: "patient",
      index: true,
    },
    isAdmin: { type: Boolean, default: false, index: true },
    isDeactivated: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      }
    }
  }
);

userSchema.index({ role: 1, createdAt: -1 });

// Mongoose 8+ / 9+ async middleware (No callback argument)
userSchema.pre("save", async function () {
  // Normalize email to lowercase
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }

  // Ensure role and isAdmin stay strictly synchronized
  if (this.isAdmin) {
    this.role = "admin";
  } else if (this.role === "admin") {
    this.isAdmin = true;
  }

  // Hash password only if modified
  if (!this.isModified("password")) return;

  // Prevent double hashing if already a valid bcrypt hash
  if (this.password && this.password.startsWith("$2")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel =
  mongoose.models.User ||
  mongoose.models.user ||
  mongoose.model("User", userSchema, "users");

export default UserModel;
