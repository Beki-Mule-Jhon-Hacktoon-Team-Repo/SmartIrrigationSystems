"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Download, Filter } from "lucide-react"

const reportData = [
  { period: "Week 1", farmers: 200, waterSaved: 450, efficiency: 82 },
  { period: "Week 2", farmers: 210, waterSaved: 520, efficiency: 84 },
  { period: "Week 3", farmers: 215, waterSaved: 580, efficiency: 86 },
  { period: "Week 4", farmers: 215, waterSaved: 550, efficiency: 88 },
]

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and view platform analytics and reports.</p>
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

      {/* Monthly Performance */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Monthly Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="farmers" fill="hsl(var(--color-primary))" />
            <Bar dataKey="waterSaved" fill="hsl(var(--color-accent))" />
            <Bar dataKey="efficiency" fill="hsl(var(--color-chart-1))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Generate Reports</h3>
          <div className="space-y-2">
            <Button className="w-full">Monthly Summary Report</Button>
            <Button className="w-full bg-transparent" variant="outline">
              Water Usage Analysis
            </Button>
            <Button className="w-full bg-transparent" variant="outline">
              Farmer Performance Report
            </Button>
            <Button className="w-full bg-transparent" variant="outline">
              System Health Report
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">Recent Downloads</h3>
          <div className="space-y-3">
            {["May 2025 Summary", "April Water Report", "Q1 Performance Review"].map((report, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">{report}</span>
                <Download className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
