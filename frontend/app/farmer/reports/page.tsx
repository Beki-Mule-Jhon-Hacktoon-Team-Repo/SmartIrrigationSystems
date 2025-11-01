"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Download, Filter } from "lucide-react"

const monthlyData = [
  { month: "Jan", water: 8000, cost: 400 },
  { month: "Feb", water: 7500, cost: 375 },
  { month: "Mar", water: 9000, cost: 450 },
  { month: "Apr", water: 7200, cost: 360 },
  { month: "May", water: 6800, cost: 340 },
]

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Monitor your farm performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Water & Cost Report */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Monthly Water Usage & Costs</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="water" fill="hsl(var(--color-primary))" name="Water (L)" />
            <Bar dataKey="cost" fill="hsl(var(--color-accent))" name="Cost ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Water Used (May)</p>
          <p className="text-3xl font-bold">6,800 L</p>
          <p className="text-xs text-green-600 mt-2">↓ 5.5% from last month</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Cost (May)</p>
          <p className="text-3xl font-bold">$340</p>
          <p className="text-xs text-green-600 mt-2">↓ 5.6% from last month</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Avg Daily Usage</p>
          <p className="text-3xl font-bold">219 L</p>
          <p className="text-xs text-muted-foreground mt-2">May average</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Savings vs Target</p>
          <p className="text-3xl font-bold">28%</p>
          <p className="text-xs text-green-600 mt-2">✓ Exceeding goals</p>
        </Card>
      </div>

      {/* Detailed Records */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="font-semibold text-lg mb-4">Irrigation History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Zone</th>
              <th className="text-left py-2 px-2">Duration</th>
              <th className="text-left py-2 px-2">Water Used</th>
              <th className="text-left py-2 px-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border hover:bg-muted/30">
                <td className="py-3 px-2">May {15 - i}, 2025</td>
                <td className="py-3 px-2">Zone {i + 1}</td>
                <td className="py-3 px-2">45 min</td>
                <td className="py-3 px-2">2,250 L</td>
                <td className="py-3 px-2">$11.25</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
