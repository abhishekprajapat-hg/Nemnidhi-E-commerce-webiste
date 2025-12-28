// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const register = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, thunkAPI) => {
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      // data should include token, user info
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      console.log("LOGIN RESPONSE:", data);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

const initialUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    return null;
  }
})();

const slice = createSlice({
  name: "auth",
  initialState: { user: initialUser, status: "idle", error: null },
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (s) => {
        s.status = "loading";
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = "succeeded";

        const userData = {
          ...a.payload.user,
          token: a.payload.token,
        };

        s.user = userData;
        localStorage.setItem("user", JSON.stringify(userData));
      })

      .addCase(login.pending, (s) => {
        s.status = "loading";
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = "succeeded";

        const userData = {
          ...a.payload.user,
          token: a.payload.token,
        };

        s.user = userData;
        localStorage.setItem("user", JSON.stringify(userData));
      })

      .addCase(login.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload;
      });
  },
});

export const { logout, setUser } = slice.actions;
export default slice.reducer;
