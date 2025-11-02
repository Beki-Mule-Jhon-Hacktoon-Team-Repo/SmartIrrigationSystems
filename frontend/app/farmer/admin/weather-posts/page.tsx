"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Cloud, Trash2, Edit } from "lucide-react"

const weatherPosts = [
  {
    id: 1,
    title: "Heavy Rain Expected",
    content: "Rain expected tomorrow morning across the region...",
    date: "May 15, 2025",
    status: "Published",
  },
  {
    id: 2,
    title: "Heatwave Warning",
    content: "Temperature alert: Expect temperatures above 35°C...",
    date: "May 14, 2025",
    status: "Published",
  },
  {
    id: 3,
    title: "Frost Advisory",
    content: "Early morning frost possible for northern regions...",
    date: "May 13, 2025",
    status: "Draft",
  },
]

export default function WeatherPostsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Weather Posts</h1>
        <p className="text-muted-foreground">Manage weather alerts and notifications for farmers.</p>
      </div>

      {/* Create New Post */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Create Weather Post</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <input
              id="title"
              type="text"
              placeholder="Weather alert title"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" placeholder="Describe the weather alert or post content..." className="min-h-24" />
          </div>
          <Button>Publish Alert</Button>
        </div>
      </Card>

      <Separator />

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Recent Posts</h2>
        {weatherPosts.map((post) => (
          <Card key={post.id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cloud className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{post.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{post.date}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  post.status === "Published"
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100"
                }`}
              >
                {post.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{post.content}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
