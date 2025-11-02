"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Droplets, MapPin } from "lucide-react"

const farms = [
  {
    id: 1,
    name: "Martinez Farm",
    farmer: "John Martinez",
    size: "250 acres",
    location: "Kansas",
    waterSaved: "85K L",
    status: "Active",
  },
  {
    id: 2,
    name: "Chen Valley",
    farmer: "Sarah Chen",
    size: "180 acres",
    location: "California",
    waterSaved: "62K L",
    status: "Active",
  },
  {
    id: 3,
    name: "O'Brien Corn",
    farmer: "Mike O'Brien",
    size: "320 acres",
    location: "Iowa",
    waterSaved: "125K L",
    status: "Active",
  },
  {
    id: 4,
    name: "Thompson Fields",
    farmer: "Lisa Thompson",
    size: "420 acres",
    location: "Texas",
    waterSaved: "180K L",
    status: "Maintenance",
  },
]

export default function FarmsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farms</h1>
          <p className="text-muted-foreground">Manage all registered farms and their devices.</p>
        </div>
        <Button>Add Farm</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search farms..." className="pl-10" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farms.map((farm) => (
          <Card key={farm.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{farm.name}</h3>
                <p className="text-sm text-muted-foreground">{farm.farmer}</p>
              </div>
              <button className="p-1 hover:bg-muted rounded-lg">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{farm.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span>{farm.size}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="font-semibold">{farm.waterSaved} saved</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  farm.status === "Active"
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100"
                    : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100"
                }`}
              >
                {farm.status}
              </span>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
