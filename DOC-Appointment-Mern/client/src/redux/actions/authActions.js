import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../Api/API";

// LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkApi) => {
    try {
      const res = await API.post("/user/login", { email, password });
      localStorage.setItem("appData", JSON.stringify(res?.data));
      return res?.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "login error";
      return thunkApi.rejectWithValue(message);
    }
  }
);
// REGISTER
export const register = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, thunkApi) => {
    try {
      const res = await API.post("/user/register", { name, email, password });
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "register error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// GET USER DATA
export const getUserData = createAsyncThunk("auth/getUserData", () => {
  const localData = localStorage.getItem("appData");
  const appData = JSON.parse(localData);
  return appData?.user;
});

// LOAD TOKEN
export const loadToken = createAsyncThunk("auth/loadToken", () => {
  const localData = localStorage.getItem("appData");
  const appData = JSON.parse(localData);
  return appData?.token;
});
// get login user details
export const getLoginUserDetails = createAsyncThunk(
  "user/getLoginUserDetails",
  async (id, thunkApi) => {
    try {
      // 🔥 Yahan dhyaan dena, BACKTICKS ( ` ) use kiye hain, single quote nahi
      const res = await API.get(`/user/get-login-user/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "user details error";
      return thunkApi.rejectWithValue(message);
    }
  }
);
// update user
export const updateUserData = createAsyncThunk(
  "user/updateUserData",
  async ({ id, formData }, thunkApi) => {
    try {
      const res = await API.patch(`/user/update/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "update user details error";
      return thunkApi.rejectWithValue(message);
    }
  }
);
// 1. Get All Appointments
export const getAllAppointments = createAsyncThunk(
  "user/getAllAppointments",
  async (id, thunkApi) => {
    try {
      const res = await API.get(`/appointment/get-user-appointments/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "user appointments error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 2. Cancel Status
export const cancelStatus = createAsyncThunk(
  "user/cancelStatus",
  async (id, thunkApi) => {
    try {
      const res = await API.post(`/appointment/cancel/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "user appointments cancel error";
      return thunkApi.rejectWithValue(message);
    }
  }
);
// 🔥 BOOK APPOINTMENT (URL Fixed: '/book' ki jagah '/create' kar diya)
export const bookAppointment = createAsyncThunk(
  "appointment/bookAppointment",
  async (bookingData, thunkApi) => {
    try {
      const res = await API.post("/appointment/create", bookingData); // 🔥 Yahan '/create' likhna hai
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "book appointment error";
      return thunkApi.rejectWithValue(message);
    }
  }
);
// reset password
export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async ({ id, oldPassword, newPassword }, thunkApi) => {
    try {
      const res = await API.patch(`/user/update-password/${id}`, {
        oldPassword,
        newPassword,
      });
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "update-password error";
      return thunkApi.rejectWithValue(message);
    }
  }
);
// send web message
export const sendWebMessage = createAsyncThunk(
  "user/sendWebMessage",
  async (msgData, thunkApi) => {
    try {
      const res = await API.post('/webmessage/create', msgData);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "sendWebMessage error";
      return thunkApi.rejectWithValue(message);
    }
  }
);