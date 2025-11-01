import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type User = {
  name?: string;
  email?: string;
  picture?: string;
};

type AuthState = {
  user: User | null;
  idToken: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
};

const initialState: AuthState = {
  user: null,
  idToken: null,
  status: "idle",
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.status = "loading";
    },
    loginSuccess(
      state,
      action: PayloadAction<{ user: User; idToken: string }>
    ) {
      state.user = action.payload.user;
      state.idToken = action.payload.idToken;
      state.status = "authenticated";
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("auth", JSON.stringify(action.payload));
        }
      } catch (e) {
        /* ignore */
      }
    },
    logout(state) {
      state.user = null;
      state.idToken = null;
      state.status = "idle";
      try {
        if (typeof window !== "undefined") localStorage.removeItem("auth");
      } catch (e) {
        /* ignore */
      }
    },
    restore(state, action: PayloadAction<{ user: User; idToken: string }>) {
      state.user = action.payload.user;
      state.idToken = action.payload.idToken;
      state.status = "authenticated";
    },
  },
});

export const { loginStart, loginSuccess, logout, restore } = slice.actions;
export default slice.reducer;
