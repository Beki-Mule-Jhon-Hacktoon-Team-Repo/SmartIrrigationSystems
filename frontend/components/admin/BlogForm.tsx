"use client";
import React, { useEffect, useState } from "react";

type Props = {
  initial?: any;
  onCancel: () => void;
  onSave: (data: any) => void;
};

export default function BlogForm({ initial, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [body, setBody] = useState(initial?.body || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || "");
      setExcerpt(initial.excerpt || "");
      setBody(initial.body || "");
      setTags((initial.tags || []).join(", "));
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      tags: tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <h3 className="text-lg font-semibold mb-3">
          {initial ? "Edit Post" : "Create Post"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border rounded p-2"
            required
          />
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Excerpt"
            className="w-full border rounded p-2"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body"
            className="w-full border rounded p-2 min-h-[160px]"
            required
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags (comma separated)"
            className="w-full border rounded p-2"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
