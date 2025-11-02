import { configureStore } from "@reduxjs/toolkit";
import blogReducer from "./features/blogs/blogSlice";

export const store = configureStore({
  reducer: {
    blogs: blogReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
