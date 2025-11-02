"use client"

import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, MapPin, Droplets, TrendingUp, AlertCircle } from "lucide-react"

const platformData = [
  { month: "Jan", farmers: 45, farms: 105 },
  { month: "Feb", farmers: 52, farms: 118 },
  { month: "Mar", farmers: 62, farms: 130 },
  { month: "Apr", farmers: 72, farms: 145 },
  { month: "May", farmers: 85, farms: 165 },
]

const waterSavingsData = [
  { name: "Saved", value: 1100000 },
  { name: "Target", value: 1200000 },
]

const COLORS = ["hsl(var(--color-primary))", "hsl(var(--color-accent))"]

export default function AdminOverview() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground">Platform performance and system metrics.</p>
      </div>

      {/* Alert */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-100">System Update</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">Platform maintenance scheduled for this weekend</p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Farmers</p>
              <p className="text-3xl font-bold">85</p>
              <p className="text-xs text-green-600 mt-1">+12% this month</p>
            </div>
            <Users className="w-10 h-10 text-primary/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Farms</p>
              <p className="text-3xl font-bold">165</p>
              <p className="text-xs text-green-600 mt-1">+9% this month</p>
            </div>
            <MapPin className="w-10 h-10 text-accent/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Water Saved</p>
              <p className="text-3xl font-bold">1.1M L</p>
              <p className="text-xs text-green-600 mt-1">92% of target</p>
            </div>
            <Droplets className="w-10 h-10 text-blue-500/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Efficiency</p>
              <p className="text-3xl font-bold">75%</p>
              <p className="text-xs text-green-600 mt-1">↑ 3% from last month</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500/30" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Platform Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="farmers"
                stroke="hsl(var(--color-primary))"
                strokeWidth={2}
                name="Farmers"
              />
              <Line type="monotone" dataKey="farms" stroke="hsl(var(--color-accent))" strokeWidth={2} name="Farms" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Water Savings Pie Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Water Savings Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={waterSavingsData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {waterSavingsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">1.1M / 1.2M Liters (92%)</p>
        </Card>
      </div>

      {/* System Health */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">API Uptime</p>
            <p className="text-2xl font-bold text-green-600">98.5%</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
            <p className="text-2xl font-bold text-green-600">195ms</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Active Alerts</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
