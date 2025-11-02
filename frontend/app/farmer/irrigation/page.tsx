"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Droplets, Power, Plus } from "lucide-react"

export default function IrrigationPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Irrigation Management</h1>
        <p className="text-muted-foreground">Control and monitor your irrigation systems.</p>
      </div>

      {/* Add New Zone */}
      <div className="flex gap-4">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Irrigation Zone
        </Button>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((zone) => (
          <Card key={zone} className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-semibold text-lg">Zone {zone}</h2>
                <p className="text-sm text-muted-foreground">Field A - Row {zone}</p>
              </div>
              <Droplets className="w-6 h-6 text-primary/60" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-2xl font-bold text-green-600">Active</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`duration-${zone}`}>Duration (minutes)</Label>
                <Input id={`duration-${zone}`} type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`flow-${zone}`}>Flow Rate (L/min)</Label>
                <Input id={`flow-${zone}`} type="number" defaultValue="50" />
              </div>

              <Button className="w-full">
                <Power className="w-4 h-4 mr-2" />
                Manual Control
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
