import express from "express";
import { isAdmin, userAuth } from "../middlewares/authMiddlewares.js";
import upload from "../middlewares/multer.js";
import {
  addDoctor,
  getAllDoctor,
  getDoctorDetails,
  updateDoctor,
  deleteDoctor,
  updateAvailableStatus // FIX: Import karna zaroori hai
} from "../controllers/doctorController.js";

const router = express.Router();

// ADD DOCTOR || POST
router.post("/add-doctor", userAuth, isAdmin, upload.single("image"), addDoctor);

// GET ALL DOCTOR || GET
router.get("/get-all", getAllDoctor);

// GET DOCTOR DETAILS || GET
router.get("/get-details/:id", getDoctorDetails);

// UPDATE DOCTOR || PATCH
router.patch("/update/:id", userAuth, isAdmin, upload.single("image"), updateDoctor);
// DELETE DOCTOR || DELETE
router.delete("/delete/:id", userAuth, isAdmin, deleteDoctor);
// DOCTOR AVAILABLE STATUS || PATCH
// FIX: deleteDoctor ko updateAvailableStatus se replace kiya
router.patch("/update-status/:id", userAuth, isAdmin, updateAvailableStatus);

export default router;