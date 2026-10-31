import DoctorModel from "../models/doctorModel.js";
import AppointmentModel from "../models/appointmentsModel.js";
import ReviewModel from "../models/reviewModel.js";
import { getAvailableSlotsForDoctor } from "../services/schedulingService.js";
import { cacheGet, cacheSet, invalidateDoctorCaches } from "../services/cacheService.js";
import { MASTER_SPECIALTIES } from "../config/specialties.js";

// ==========================================
// 1. ADD / REGISTER A NEW DOCTOR (Admin Only)
// ==========================================
export const addDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      degree,
      speciality,
      fees,
      experience,
      about,
      gender,
      phone,
      address,
      dob,
      workingDays,
      workingHoursStart,
      workingHoursEnd,
      slotDuration,
    } = req.body;

    if (!name || !email || !degree || !speciality || fees === undefined || !experience || !about) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, degree, speciality, fees, experience, and about.",
      });
    }

    const existingDoctor = await DoctorModel.findOne({ email: email.toLowerCase().trim() });
    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "A doctor with this email is already registered.",
      });
    }

    let imageString = "";
    if (req.file) {
      imageString = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const doctorData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      degree,
      fees: Number(fees),
      about,
      gender: gender || "",
      phone: phone || "",
      address: address || "",
      dob: dob || "",
      speciality: speciality.trim(),
      experience: Number(experience),
      image: imageString,
      rating: 0,
      numReviews: 0,
      workingDays: workingDays ? (Array.isArray(workingDays) ? workingDays : JSON.parse(workingDays)) : undefined,
      workingHours: {
        start: workingHoursStart || "09:00",
        end: workingHoursEnd || "17:00",
      },
      slotDuration: slotDuration ? Number(slotDuration) : 30,
    };

    const doctor = new DoctorModel(doctorData);
    await doctor.save();

    // Invalidate cached doctor listings
    await invalidateDoctorCaches();

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET ALL DOCTORS (With Cache-Aside, Search, Filter & Pagination)
// ==========================================
export const getAllDoctor = async (req, res, next) => {
  try {
    const {
      search,
      speciality,
      minFees,
      maxFees,
      minExperience,
      available,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const cacheKey = `doctors:list:${JSON.stringify(req.query)}`;
    const cachedResponse = await cacheGet(cacheKey);
    if (cachedResponse) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cachedResponse);
    }

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { speciality: { $regex: search, $options: "i" } },
        { degree: { $regex: search, $options: "i" } },
      ];
    }

    if (speciality && speciality !== "All" && speciality !== "all" && speciality !== "All Specialties") {
      const cleanSpeciality = speciality.trim();
      query.speciality = { $regex: `^\\s*${cleanSpeciality}\\s*$`, $options: "i" };
    }

    if (available !== undefined && available !== "") {
      query.available = available === "true";
    }

    if (minFees || maxFees) {
      query.fees = {};
      if (minFees) query.fees.$gte = Number(minFees);
      if (maxFees) query.fees.$lte = Number(maxFees);
    }

    if (minExperience) {
      query.experience = { $gte: Number(minExperience) };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === "fees_asc") sortOption = { fees: 1 };
    else if (sort === "fees_desc") sortOption = { fees: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "experience") sortOption = { experience: -1 };

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [doctors, totalCount] = await Promise.all([
      DoctorModel.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      DoctorModel.countDocuments(query),
    ]);

    const responsePayload = {
      success: true,
      message: "Doctors retrieved successfully",
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      doctors,
    };

    // Cache doctor listing for 10 minutes (600s)
    await cacheSet(cacheKey, responsePayload, 600);

    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET DOCTOR DETAILS (With Profile Cache & Reviews)
// ==========================================
export const getDoctorDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required.",
      });
    }

    const cacheKey = `doctors:profile:${id}`;
    const cachedProfile = await cacheGet(cacheKey);
    if (cachedProfile) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cachedProfile);
    }

    const doctor = await DoctorModel.findById(id).lean();
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "No doctor found with this ID.",
      });
    }

    // Fetch verified reviews for this doctor
    const reviews = await ReviewModel.find({ doctorId: doctor._id })
      .populate("userId", "name image")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const responsePayload = {
      success: true,
      message: "Doctor details fetched successfully",
      doctor,
      reviews,
    };

    // Cache profile for 5 minutes (300s)
    await cacheSet(cacheKey, responsePayload, 300);

    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. GET DISTINCT SPECIALITIES (Cached)
// ==========================================
export const getSpecialities = async (req, res, next) => {
  try {
    const cacheKey = "doctor_specialities";
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const dbSpecialties = await DoctorModel.distinct("speciality");

    // Case-insensitive merge: populate all master specialties first, then merge custom ones
    const mergedMap = new Map();
    MASTER_SPECIALTIES.forEach((s) => {
      mergedMap.set(s.toLowerCase().trim(), s);
    });

    dbSpecialties.forEach((s) => {
      if (s && s.trim()) {
        const clean = s.trim();
        const lower = clean.toLowerCase();
        if (!mergedMap.has(lower)) {
          mergedMap.set(lower, clean);
        }
      }
    });

    const payload = {
      success: true,
      specialities: Array.from(mergedMap.values()),
    };

    await cacheSet(cacheKey, payload, 1800); // 30 mins
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. UPDATE DOCTOR (Admin Only)
// ==========================================
export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      degree,
      speciality,
      fees,
      experience,
      about,
      address,
      phone,
      gender,
      available,
      workingDays,
      workingHoursStart,
      workingHoursEnd,
      slotDuration,
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (degree) updateData.degree = degree;
    if (speciality) updateData.speciality = speciality.trim();
    if (fees !== undefined) updateData.fees = Number(fees);
    if (about) updateData.about = about;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;
    if (gender) updateData.gender = gender;
    if (experience !== undefined) updateData.experience = Number(experience);
    if (available !== undefined) updateData.available = available === true || available === "true";

    if (workingDays) {
      updateData.workingDays = Array.isArray(workingDays) ? workingDays : JSON.parse(workingDays);
    }
    if (workingHoursStart || workingHoursEnd) {
      updateData.workingHours = {
        start: workingHoursStart || "09:00",
        end: workingHoursEnd || "17:00",
      };
    }
    if (slotDuration) updateData.slotDuration = Number(slotDuration);

    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const updatedDoctor = await DoctorModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    // Invalidate cached listings and profiles
    await invalidateDoctorCaches();

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. DELETE OR DEACTIVATE DOCTOR (Admin Only)
// ==========================================
export const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check for active booked future appointments
    const activeAppointments = await AppointmentModel.countDocuments({
      doctorId: id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (activeAppointments > 0) {
      // Soft-deactivate to avoid breaking historical records
      await DoctorModel.findByIdAndUpdate(id, { available: false });
      await invalidateDoctorCaches();
      return res.status(200).json({
        success: true,
        message: `Doctor has ${activeAppointments} active appointments and was safely marked unavailable rather than deleted.`,
        deactivated: true,
      });
    }

    await DoctorModel.findByIdAndDelete(id);
    await invalidateDoctorCaches();

    return res.status(200).json({
      success: true,
      message: "Doctor record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. TOGGLE DOCTOR AVAILABILITY STATUS (Admin Only)
// ==========================================
export const updateAvailableStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await DoctorModel.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    doctor.available = !doctor.available;
    await doctor.save();

    await invalidateDoctorCaches();

    return res.status(200).json({
      success: true,
      message: `Doctor status updated to ${doctor.available ? "Available" : "Unavailable"}`,
      available: doctor.available,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. DYNAMIC AVAILABLE SLOTS FOR A SPECIFIC DATE
// ==========================================
export const getDoctorSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date query parameter is required (format: YYYY-MM-DD)",
      });
    }

    // Always calculate fresh slots directly from confirmed database reservations!
    const slotData = await getAvailableSlotsForDoctor(id, date);

    return res.status(200).json({
      success: true,
      message: "Available slots fetched successfully",
      ...slotData,
    });
  } catch (error) {
    next(error);
  }
};
