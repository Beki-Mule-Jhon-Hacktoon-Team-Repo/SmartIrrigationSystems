"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
} from "../../features/blogs/blogSlice";
import { RootState } from "../../store";
import BlogForm from "./BlogForm";

export default function BlogManager() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector((s: RootState) => s.blogs);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, limit: 50 }));
  }, [dispatch]);

  const onCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const onEdit = (post: any) => {
    setEditing(post);
    setShowForm(true);
  };
  const onDelete = async (post: any) => {
    if (!confirm("Delete this post?")) return;
    try {
      await dispatch(deletePost(post._id)).unwrap();
      // re-fetch
      dispatch(fetchPosts({ page: 1, limit: 50 }));
    } catch (e) {
      alert("Delete failed");
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await dispatch(updatePost({ id: editing._id, updates: data })).unwrap();
      } else {
        await dispatch(createPost(data)).unwrap();
      }
      setShowForm(false);
      dispatch(fetchPosts({ page: 1, limit: 50 }));
    } catch (e) {
      alert("Save failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Manage Blogs</h2>
        <div>
          <button
            onClick={onCreate}
            className="px-3 py-1 bg-primary text-white rounded"
          >
            Create
          </button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : null}
      {error ? <div className="text-red-600">{error}</div> : null}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No posts</div>
        ) : null}
        {items.map((p: any) => (
          <div
            key={p._id || p.id}
            className="p-3 border rounded flex items-start justify-between"
          >
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">
                {p.excerpt || (p.body || "").slice(0, 120)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(p)}
                className="px-2 py-1 border rounded text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(p)}
                className="px-2 py-1 border rounded text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <BlogForm
          initial={editing}
          onCancel={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
