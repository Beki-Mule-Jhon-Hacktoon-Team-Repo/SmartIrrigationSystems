"use client"

import { Card } from "@/components/ui/card"
import { Alert } from "@/components/alerts-notifications"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Droplets, Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

const moistureData = [
  { time: "12:00", moisture: 45 },
  { time: "1:00", moisture: 48 },
  { time: "2:00", moisture: 52 },
  { time: "3:00", moisture: 58 },
  { time: "4:00", moisture: 55 },
  { time: "5:00", moisture: 50 },
]

const waterUsageData = [
  { day: "Mon", usage: 1200 },
  { day: "Tue", usage: 1400 },
  { day: "Wed", usage: 1100 },
  { day: "Thu", usage: 900 },
  { day: "Fri", usage: 1300 },
  { day: "Sat", usage: 1500 },
]

export default function FarmerDashboard() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, John! Here's your farm overview.</p>
      </div>

      {/* Alerts */}
      <Alert
        type="info"
        title="Weather Alert"
        message="Rain expected tomorrow morning. Consider reducing irrigation."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Soil Moisture</p>
              <p className="text-2xl font-bold">52%</p>
              <p className="text-xs text-green-600 mt-1">Optimal level</p>
            </div>
            <Droplets className="w-10 h-10 text-primary/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Water Used</p>
              <p className="text-2xl font-bold">1.2K L</p>
              <p className="text-xs text-green-600 mt-1">15% below target</p>
            </div>
            <Zap className="w-10 h-10 text-accent/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Crop Health</p>
              <p className="text-2xl font-bold">95%</p>
              <p className="text-xs text-green-600 mt-1">Excellent</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Devices</p>
              <p className="text-2xl font-bold">8/8</p>
              <p className="text-xs text-green-600 mt-1">All connected</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500/30" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Soil Moisture Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moistureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="moisture" stroke="hsl(var(--color-primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Water Usage Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Weekly Water Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="usage" fill="hsl(var(--color-accent))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">AI Recommendations</h2>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Irrigation schedule optimized</p>
              <p className="text-sm text-muted-foreground">Reduce morning irrigation by 10% to save water</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Temperature alert</p>
              <p className="text-sm text-muted-foreground">Expected temperature drop may affect crop growth</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
