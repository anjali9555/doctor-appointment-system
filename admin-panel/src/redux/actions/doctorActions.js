import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../Api/API";

// 1. GET ALL DOCTORS
export const getAllDoctors = createAsyncThunk(
  "doctor/getAllDoctors",
  async (_, thunkApi) => {
    try {
      const res = await API.get("/doctor/get-all"); 
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "get all doc error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 2. GET DOCTOR DETAILS
export const getDoctorDetails = createAsyncThunk(
  "doctor/getDoctorDetails",
  async (id, thunkApi) => {
    try {
      const res = await API.get(`/doctor/get-details/${id}`); 
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "get doc details error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 3. ADD NEW DOCTOR
export const addDoctor = createAsyncThunk(
  "doctor/addDoctor",
  async (formData, thunkApi) => {
    try {
      // Dhyan dein: API URL aapke backend route ke hisaab se hona chahiye
      const res = await API.post("/doctor/add-doctor", formData);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "add doctor error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 4. UPDATE DOCTOR
export const updateDoctor = createAsyncThunk(
  "doctor/updateDoctor",
  async ({ id, formData }, thunkApi) => {
    try {
      const res = await API.patch(`/doctor/update/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "update doc error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 5. DELETE DOCTOR
export const deleteDoctor = createAsyncThunk(
  "doctor/deleteDoctor",
  async (id, thunkApi) => {
    try {
      const res = await API.delete(`/doctor/delete/${id}`);
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "delete doctor error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 6. UPDATE STATUS DOCTOR (FIXED)
export const updateStatus = createAsyncThunk(
  "doctor/updateStatus",
  async ({ id, availableStatus }, thunkApi) => {
    try {
      // FIX: 'availableStatus' ki spelling theek ki aur usko object {} ke andar daal kar bheja
      const res = await API.patch(`/doctor/update-status/${id}`, { availableStatus });
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "update status doc error";
      return thunkApi.rejectWithValue(message);
    }
  }
);