import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../Api/API";

// 1. Get All Appointments
export const getAllAppointments = createAsyncThunk(
  "appointment/getAllAppointments",
  async (_, thunkApi) => {
    try {
      const res = await API.get("/appointment/get-all");
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "get all appointments error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 2. Get Appointment Details
export const getAppointmentDetails = createAsyncThunk(
  "appointment/getAppointmentDetails",
  async (id, thunkApi) => {
    try {
      const res = await API.get(`/appointment/get-details/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "getAppointmentDetails error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 3. Update Appointment Status
export const updateAppointmentStatus = createAsyncThunk(
  "appointment/updateStatus",
  async ({ id, bookingStatus }, thunkApi) => {
    try {
      // Dono keys ek sath bhej rahe hain taaki backend ko koi dikkat na ho
      const res = await API.patch(`/appointment/update-status/${id}`, { 
        appointmentStatus: bookingStatus,
        status: bookingStatus 
      });
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "update appointment status error";
      return thunkApi.rejectWithValue(message);
    }
  }
);