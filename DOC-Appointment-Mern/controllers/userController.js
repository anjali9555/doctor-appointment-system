import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentsModel.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

// ==========================================
// REGISTER USER
// ==========================================
export const userRegister = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, address } = req.body;

    // 1. Validation check
    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // 2. Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "User already exists. Please login",
      });
    }

    // 3. Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save the new user to DB
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      dob,
      gender,
      address,
    });
    
    await user.save();

    res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Registration API",
      error,
    });
  }
};

// ==========================================
// LOGIN USER
// ==========================================
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation check
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Please provide email and password",
      });
    }

    // 2. Find user in the database
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      });
    }

    // 3. Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // 4. Generate JWT Token
    // Ensure JWT_SECRET exists in your .env file
    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", 
    });

    // 5. Hide the password before sending user data in response
    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "Login Successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Login API",
      error,
    });
  }
};

// ==========================================
// UPDATE USER DETAILS (Profile & Image)
// ==========================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).send({
        success: false,
        message: 'User Id Not Found'
      });
    }
    
    const { name, phone, dob, gender, address } = req.body;
    
    // Convert uploaded memory buffer to base64 string
    const photoToBase64 = req.file ? req.file.buffer.toString('base64') : undefined;
    
    const updateData = { name, dob, address, phone, gender };
    
    // Only update the image if a new file was actually sent
    if (photoToBase64) {
      updateData.image = photoToBase64;
    }

    // Update document and return the newly updated version
    const user = await userModel.findByIdAndUpdate(
      id, 
      { $set: updateData },
      { returnDocument: 'after' } 
    );

    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      user,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something Went wrong in update user api",
      error,
    });
  }
};

// ==========================================
// UPDATE PASSWORD
// ==========================================
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).send({
        success: false,
        message: 'User id not found'
      });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).send({
        success: false,
        message: 'Please Provide Old And New password'
      });
    }

    // 1. Find user
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Check if the old password matches the DB
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: 'Invalid Old Password'
      });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Save new hashed password
    user.password = hashedPassword;
    await user.save();

    res.status(200).send({
      success: true,
      message: 'Password Updated Successfully'
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error In Update Password API',
      error,
    });
  }
};
// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.status(200).send({
      success: true,
      message: "All Users",
      totalCount: users.length,
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Get All Users API",
      error,
    });
  }
};
export const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id; // Yahan dhyan dein, route mein :id hai toh req.params.id hona chahiye

    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "Please provide user id",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "No user found with this id",
      });
    }

    const appointments = await appointmentModel.find({ userId: user?._id });

    res.status(200).send({
      success: true,
      message: "Details Fetched Successfully",
      user,
      appointments,
    });
  } catch (error) {
    console.log(error); 
    res.status(500).send({
      success: false,
      message: "Error In Get Users Details API",
      error,
    });
  }
};
// GET STATS
export const getStats = async (req, res) => {
  try {
    const users = await userModel.find({});
    const doctors = await doctorModel.find({});
    
    const appointmtents = await appointmentModel.aggregate([
      { $group: { _id: null, totalEarning: { $sum: { $toDouble: "$amount" } } } }
    ]);
    
    const total = appointmtents.length > 0 ? appointmtents[0].totalEarning : 0;
    
    res.status(200).send({
      success: true,
      message: "All Stats",
      totalUsers: users.length,
      totalDoctors: doctors.length,
      earnings: total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get stats API",
      error,
    });
  }
};
//GET LOGIN USER
export const getLoginUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please provide user id",
      });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "no user found",
      });
    }

    res.status(200).send({
      success: true,
      message: "login user detail",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get login user API",
      error,
    });
  }
};