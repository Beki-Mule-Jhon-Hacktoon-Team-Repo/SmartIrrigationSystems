import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchJson } from "../../lib/api";

export const fetchPosts = createAsyncThunk(
  "blogs/fetchPosts",
  async (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    const url = `/api/v1/blog?${q.toString()}`;
    return await fetchJson(url);
  }
);

export const createPost = createAsyncThunk(
  "blogs/createPost",
  async (payload: any) => {
    return await fetchJson(`/api/v1/blog`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
);

export const updatePost = createAsyncThunk(
  "blogs/updatePost",
  async ({ id, updates }: { id: string; updates: any }) => {
    return await fetchJson(`/api/v1/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }
);

export const deletePost = createAsyncThunk(
  "blogs/deletePost",
  async (id: string) => {
    return await fetchJson(`/api/v1/blog/${id}`, { method: "DELETE" });
  }
);

const blogSlice = createSlice({
  name: "blogs",
  initialState: {
    items: [] as any[],
    loading: false,
    error: null as string | null,
    meta: {},
  },
  reducers: {
    // local helpers if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data?.items || [];
        state.meta = action.payload?.data?.meta || {};
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load posts";
      })

      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        const post = action.payload?.data?.post;
        if (post) state.items.unshift(post);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Create failed";
      })

      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;
        const post = action.payload?.data?.post;
        if (post)
          state.items = state.items.map((p) => (p._id === post._id ? post : p));
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Update failed";
      })

      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        // backend returns { message } — remove by id passed in arg (thunk arg isn't in payload), keep it simple: reload not implemented here
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Delete failed";
      });
  },
});

export default blogSlice.reducer;
