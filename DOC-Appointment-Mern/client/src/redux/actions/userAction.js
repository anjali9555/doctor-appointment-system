import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../Api/API"; 

// 1. GET ALL USERS
export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/user/get-all");
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 2. GET USER DETAILS (🔥 Yeh function missing tha, isko add karo)
export const getUserDetails = createAsyncThunk(
  "user/getUserDetails",
  async (id, thunkApi) => {
    try {
      const res = await API.get(`/user/get-user/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "/user/get-user error";
      return thunkApi.rejectWithValue(message);
    }
  }
);

// 3. Get All Stats
export const getStats = createAsyncThunk(
  "user/getStats",
  async (_, thunkApi) => {
    try {
      const res = await API.get("/user/get-stats");
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "/user/get-stats error";
      return thunkApi.rejectWithValue(message);
    }
  }
);