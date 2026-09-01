import { createSlice } from "@reduxjs/toolkit";
import { login, register, getLoginUserDetails,updateUserData, loadToken,getAllAppointments, 
  cancelStatus ,resetPassword,sendWebMessage
} from "../actions/authActions";

const initialState = {
  user: null,
  token: null,
  loading: false,
  success: false,
  error: null,
  appointments:null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    // 🔥 Logout reducer added here
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login logic
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // register logic
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // get login user data (🔥 Ab yeh bracket ke andar hai)
      .addCase(getLoginUserDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLoginUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        // state.success = true;
        state.user = action.payload.user; 
      })
      .addCase(getLoginUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ==========================================
      // USER APPOINTMENTS
      // ==========================================
      .addCase(getAllAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.data || action.payload.appointments || action.payload; 
      })
      .addCase(getAllAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==========================================
      // USER APPOINTMENTS CANCEL
      // ==========================================
      .addCase(cancelStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true; 
      })
      .addCase(cancelStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // update user
      .addCase(updateUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user;
      })
      .addCase(updateUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // reset password extraReducers
.addCase(resetPassword.pending, (state) => {
  state.loading = true;
})
.addCase(resetPassword.fulfilled, (state) => {
  state.loading = false;
  state.success = true;
})
.addCase(resetPassword.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
// web message
.addCase(sendWebMessage.pending, (state) => {
  state.loading = true;
})
.addCase(sendWebMessage.fulfilled, (state) => {
  state.loading = false;
  state.success = true;
})
.addCase(sendWebMessage.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
      
      // load token
      .addCase(loadToken.fulfilled, (state, action) => {
        state.token = action.payload;
      });
  },
});

// 🔥 Logout export bhi yahan theek se kar diya hai
export const { reset, logout } = authSlice.actions;
export default authSlice.reducer;