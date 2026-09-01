import { createSlice } from "@reduxjs/toolkit";
import { getAllUsers, getUserDetails,getStats } from "../actions/userAction";

const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    user: {},
    appointments: [],
    loading: false,
    success: false,
    error: null,
    stats: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- GET ALL USERS ---
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload?.users || [];
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Get Stats ---
      .addCase(getStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getStats.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        console.log("🔥 Backend se aaya poora action.payload:", action.payload); // 👈 Yeh line dalo
        state.stats = action.payload; // 🔥 Backend se aane wala 'stats' object yahan store hoga
      })
      .addCase(getStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- GET USER DETAILS ---
      .addCase(getUserDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload?.user || {};
        state.appointments = action.payload?.appointments || action.payload?.appoinmtents || [];
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const { reset } = userSlice.actions;
export default userSlice.reducer;