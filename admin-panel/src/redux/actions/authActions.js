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
// Get User Details
export const getUserDetails = createAsyncThunk(
  "user/getUserDetails",
  async (id, thunkApi) => {
    try {
      // Dhyan dein: URL aapke backend route ke hisaab se hona chahiye
      const res = await API.get(`/api/v1/user/get-user/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "user details error";
      return thunkApi.rejectWithValue(message);
    }
  }
);