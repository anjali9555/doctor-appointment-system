import { createSlice } from "@reduxjs/toolkit";
import { 
  getAllAppointments, 
  getAppointmentDetails,
  updateAppointmentStatus 
} from "../actions/appointmentAction";

const appointmentSlice = createSlice({
  name: "appointment",
  initialState: {
    loading: false,
    success: false,
    appointments: null,
    appointment: null,
    error: null,
  },
  reducers: {
    reset: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Get All Appointments ---
      .addCase(getAllAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllAppointments.fulfilled, (state, action) => {
        state.loading = false;
        // ❌ YAHAN SE 'state.success = true;' HATA DIYA HAI ❌
        state.appointments = action.payload.appointments;
      })
      .addCase(getAllAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Get Appointment Details ---
      .addCase(getAppointmentDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAppointmentDetails.fulfilled, (state, action) => {
        state.loading = false;
        // ❌ YAHAN BHI NAHI HOGA ❌
        state.appointment = action.payload.appointmentDetails; 
      })
      .addCase(getAppointmentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Update Appointment Status ---
      .addCase(updateAppointmentStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ SIRF YAHAN SUCCESS TRUE RAHEGA (Update hone par) ✅
        state.success = true; 
      })
      .addCase(updateAppointmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { reset } = appointmentSlice.actions;
export default appointmentSlice.reducer;