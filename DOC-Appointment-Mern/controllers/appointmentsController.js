import appointmentModel from "../models/appointmentsModel.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";

export const bookAppointment = async (req, res) => {
  try {
    const { userId, doctorId, amount, slotDate, slotTime } = req.body;

    if (!userId || !doctorId || !amount || !slotTime || !slotDate) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    const appointment = new appointmentModel({
      userId,
      doctorId,
      slotDate,
      slotTime,
      amount,
    });

    await appointment.save();

    res.status(201).send({
      success: true,
      message: "Appointment Booked Successfully",
      appointment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In create appointment API",
      error,
    });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    
    res.status(200).send({
      success: true,
      message: "All Appointments",
      totalCount: appointments.length,
      appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get all appointments API",
      error,
    });
  }
};

export const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please Provide Appointment ID",
      });
    }

    const appointment = await appointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "No Appointment found with this ID",
      });
    }

    const user = await userModel.findById(appointment.userId);
    const doctor = await doctorModel.findById(appointment.doctorId);

    res.status(200).send({
      success: true,
      message: "Appointment Details Fetched Successfully",
      appointmentDetails: {
        clientName: user?.name || "Unknown User",
        clientPhone: user?.phone || "N/A",
        clientEmail: user?.email || "N/A",
        doctorName: doctor?.name || "Unknown Doctor",
        doctorPhone: doctor?.phone || "N/A",
        doctorEmail: doctor?.email || "N/A",
        bookingDate: appointment?.slotDate,
        bookingTime: appointment?.slotTime,
        amount: appointment?.amount,
        bookingStatus: appointment?.status,
        paymentMode: appointment?.payment,
        createdAt: appointment?.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get appointment details API",
      error,
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please Provide Appointment ID",
      });
    }

    // 🔥 SMART FIX: Backend ab 'appointmentStatus' ya 'status' dono mein se koi bhi chalne dega
    const statusToUpdate = req.body.appointmentStatus || req.body.status; 

    if (!statusToUpdate) {
      return res.status(400).send({
        success: false,
        message: "Please Provide Appointment Status",
      });
    }

    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      { $set: { status: statusToUpdate } },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Appointment Status Has Been Updated",
      appointment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in update appointment status API",
      error,
    });
  }
};

export const getUserAppointments = async (req, res) => {
  try {
    const userId = req.params.id || req.body?.userId;

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Please Provide User ID",
      });
    }

    const appointments = await appointmentModel.find({ userId: userId });

    res.status(200).send({
      success: true,
      message: "Your Appointments",
      totalCount: appointments.length,
      appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get User appointment API",
      error,
    });
  }
};

export const getUserAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please Provide Appointment ID",
      });
    }

    const appointment = await appointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "No Appointment found with this ID",
      });
    }

    const user = await userModel.findById(appointment.userId);
    const doctor = await doctorModel.findById(appointment.doctorId);

    res.status(200).send({
      success: true,
      message: "Appointment Details Fetched Successfully",
      appointmentDetails: {
        doctorName: doctor?.name || "Unknown Doctor",
        doctorPhone: doctor?.phone || "N/A",
        doctorEmail: doctor?.email || "N/A",
        bookingDate: appointment?.slotDate,
        bookingTime: appointment?.slotTime,
        amount: appointment?.amount,
        bookingStatus: appointment?.status,
        paymentMode: appointment?.payment,
        createdAt: appointment?.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get user appointment details API",
      error,
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please Provide Appointment ID", 
      });
    }

    const appointment = await appointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "No Appointment found with this ID", 
      });
    }

    // 🔥 Sirf status update kar do, body validation ki zaroorat nahi hai
    await appointmentModel.findByIdAndUpdate(id, { status: "cancelled" }, { new: true });

    res.status(200).send({
      success: true,
      message: "Appointment Canceled Successfully", 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in cancel appointment API",
      error,
    });
  }
};