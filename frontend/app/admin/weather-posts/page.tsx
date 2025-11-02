"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Cloud, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export default function WeatherPostsPage() {
  // API base
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const BLOG_BASE = "http://localhost:5000/api/v1/blog";
  const LIST_URL = `http://localhost:5000/api/v1/blog?tag=weather&page=1&limit=50`;

  // form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // posts list state
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    fetch(LIST_URL, { headers: { "Content-Type": "application/json" } })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const items = data?.data?.items ?? [];
        setPosts(items);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load weather posts:", err);
        setLoadError(String(err?.message ?? err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [LIST_URL]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPublished(true);
    setEditingId(null);
    setFormError(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    if (!title.trim() || !content.trim()) {
      setFormError("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        body: content.trim(),
        excerpt: content.trim().slice(0, 200),
        tags: ["weather"],
        published: Boolean(published),
      };
      if (editingId) {
        const res = await fetch(
          `http://localhost:5000/api/v1/blog/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || JSON.stringify(data));
        // update local list
        setPosts((prev) =>
          prev.map((p) => (p._id === editingId ? data.data.post : p))
        );
      } else {
        const res = await fetch(BLOG_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || JSON.stringify(data));
        const post = data.data.post;
        setPosts((prev) => [post, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error("Save failed", err);
      setFormError(String(err ?? err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: any) => {
    setEditingId(post._id || post.id);
    setTitle(post.title || "");
    setContent(post.body || post.excerpt || "");
    setPublished(Boolean(post.published));
    setFormError(null);
  };

  const handleDelete = async (post: any) => {
    if (!confirm("Delete this post?")) return;
    try {
      const id = post._id || post.id;
      const res = await fetch(`${BLOG_BASE}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || JSON.stringify(data));
      setPosts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Weather Posts</h1>
        <p className="text-muted-foreground">
          Manage weather alerts and notifications for farmers.
        </p>
      </div>

      {/* Create / Edit Post */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">
          {editingId ? "Edit Weather Post" : "Create Weather Post"}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weather alert title"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) =>
                setContent((e.target as HTMLTextAreaElement).value)
              }
              placeholder="Describe the weather alert or post content..."
              className="min-h-24"
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                disabled={saving}
              />
              <span>Publish</span>
            </label>

            <div className="ml-auto flex items-center gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving
                  ? editingId
                    ? "Saving..."
                    : "Publishing..."
                  : editingId
                  ? "Save changes"
                  : "Publish Alert"}
              </Button>
            </div>
          </div>

          {formError && <div className="text-sm text-red-600">{formError}</div>}
        </form>
      </Card>

      <Separator />

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Recent Posts</h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading posts…</div>
        ) : loadError ? (
          <div className="text-sm text-red-600">Failed to load posts</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No weather posts yet.
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post._id || post.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{post.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      post.publishedAt || post.createdAt || Date.now()
                    ).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    post.published
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {post.excerpt || (post.body || "").slice(0, 300)}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(post)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(post)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Link
                  href={`/blog/${post.slug || post._id}`}
                  className="ml-auto text-sm text-primary self-center"
                >
                  Open post
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
