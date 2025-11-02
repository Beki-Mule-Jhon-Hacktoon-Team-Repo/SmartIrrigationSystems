"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Mail, Eye } from "lucide-react"

const farmers = [
  { id: 1, name: "John Martinez", email: "john@example.com", farms: 3, location: "Kansas", status: "Active" },
  { id: 2, name: "Sarah Chen", email: "sarah@example.com", farms: 2, location: "California", status: "Active" },
  { id: 3, name: "Mike O'Brien", email: "mike@example.com", farms: 1, location: "Iowa", status: "Active" },
  { id: 4, name: "Lisa Thompson", email: "lisa@example.com", farms: 4, location: "Texas", status: "Inactive" },
  { id: 5, name: "Robert Garcia", email: "robert@example.com", farms: 2, location: "Nebraska", status: "Active" },
]

export default function FarmersPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farmers</h1>
          <p className="text-muted-foreground">Manage all registered farmers on the platform.</p>
        </div>
        <Button>Add Farmer</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search farmers..." className="pl-10" />
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold">Name</th>
              <th className="text-left py-3 px-4 font-semibold">Email</th>
              <th className="text-left py-3 px-4 font-semibold">Farms</th>
              <th className="text-left py-3 px-4 font-semibold">Location</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((farmer) => (
              <tr key={farmer.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium">{farmer.name}</td>
                <td className="py-3 px-4">{farmer.email}</td>
                <td className="py-3 px-4">{farmer.farms}</td>
                <td className="py-3 px-4">{farmer.location}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      farmer.status === "Active"
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100"
                    }`}
                  >
                    {farmer.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-muted rounded-lg">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded-lg">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
