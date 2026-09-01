import doctorModel from "../models/doctorModel.js";

// add doctor
export const addDoctor = async (req, res) => {
  try {
    // Note: 'image' is removed from destructuring here because it comes from req.file, not req.body
    const { name, email, degree, fees, about, gender, phone, address, speciality, experience, dob } = req.body;
    
    // Validation
    if (!name || !email || !degree || !fees || !about || !gender || !phone || !address || !speciality || !experience ) {
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields"
      });
    }

    // Convert file buffer to base64 safely
    const photoBase64 = req.file ? req.file.buffer.toString('base64') : undefined;

    // FIX: Use curly braces {} to create the object
    const doctorData = { 
      name, 
      email, 
      degree, 
      fees, 
      about, 
      gender, 
      phone, 
      address, 
      image: photoBase64, 
      speciality, 
      experience, 
      
    };
    
    const doctor = new doctorModel(doctorData);
    await doctor.save();

    res.status(201).send({
      success: true,
      message: "Doctor Created",
      doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In add Doctor API",
      error,
    });
  }
};
// GET ALL DOCTORS
// ==========================================
export const getAllDoctor = async (req, res) => {
  try {
    // Fetch all doctors from the database
    const doctors = await doctorModel.find({});
    
    // Send response
    res.status(200).send({
      success: true,
      message: 'All Doctors List',
      totalCount: doctors.length,
      doctors
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get all Doctor API",
      error,
    });
  }
};
// ==========================================
// GET DOCTOR DETAILS
// ==========================================
export const getDoctorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided
    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please add doctor id", // Fixed typo
      });
    }

    // Find doctor by ID
    const doctor = await doctorModel.findById(id);
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "No Doctor Found With This ID",
      });
    }

    // Success response
    res.status(200).send({
      success: true,
      message: "Details Fetched Successfully",
      doctor,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get doctor details API", // Fixed typos
      error,
    });
  }
};
// update doctor
// ==========================================
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided
    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please add doctor id", 
      });
    }

    // Extract body data
    const data = req.body;
    
    // Convert new image to base64 ONLY if a file was uploaded
    const photoBase64 = req.file ? req.file.buffer.toString('base64') : undefined;
    
    // FIX: If a new image was uploaded, attach it to the data object
    if (photoBase64) {
      data.image = photoBase64;
    }

    // Update the doctor document
    // FIX: Changed returnOriginal: false to the standard new: true
    const doctor = await doctorModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true } // runValidators ensures the new data matches your schema rules
    );

    // If ID was invalid or doctor deleted
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not found to update",
      });
    }

    res.status(200).send({
      success: true,
      message: "Doctor Details Updated",
      doctor,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In update Doctor API", // Fixed typo
      error,
    });
  }
};
// ==========================================
// DELETE DOCTOR
// ==========================================
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please add doctor id", // FIX: Spelling theek ki
      });
    }

    // FIX: Result ko variable mein store kiya taaki check kar sakein
    const doctor = await doctorModel.findByIdAndDelete(id);

    // FIX: Agar doctor nahi mila (null) toh 404 return karo
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not found or already deleted",
      });
    }

    res.status(200).send({
      success: true,
      message: "Doctor Has been Deleted",
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in delete Doctor API", // FIX: DOctor -> Doctor
      error,
    });
  }
};
// update status 
export const updateAvailableStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please add doctor id", 
      });
    }

    // FIX: Spelling theek ki
    const { availableStatus } = req.body; 
    
    if (availableStatus === undefined) { // FIX: Changed check logic for booleans
        return res.status(400).send({
          success: false,
          message: "Please provide available status",
        });
    }

    // FIX: new:true ensure karta hai ki updated data return ho
    const doctor = await doctorModel.findByIdAndUpdate(
      id,
      { $set: { available: availableStatus } },
      { new: true, runValidators: true } 
    );

    if (!doctor) {
        return res.status(404).send({
          success: false,
          message: "Doctor not found to update status",
        });
    }

    res.status(200).send({
      success: true,
      message: "Doctor Available Status Has been Updated",
      doctor
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in update available Doctor API", 
      error,
    });
  }
};