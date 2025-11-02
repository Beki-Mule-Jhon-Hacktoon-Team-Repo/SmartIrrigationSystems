"use client"

import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Brain, TrendingUp } from "lucide-react"

const predictionData = [
  { day: "Today", actual: 55, predicted: 55 },
  { day: "+1 day", actual: null, predicted: 58 },
  { day: "+2 days", actual: null, predicted: 62 },
  { day: "+3 days", actual: null, predicted: 59 },
  { day: "+4 days", actual: null, predicted: 56 },
  { day: "+5 days", actual: null, predicted: 54 },
]

const yieldPrediction = [
  { month: "Jan", yield: 100 },
  { month: "Feb", yield: 150 },
  { month: "Mar", yield: 200 },
  { month: "Apr", yield: 280 },
  { month: "May", yield: 350 },
]

export default function PredictionsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Predictions</h1>
        <p className="text-muted-foreground">AI-powered insights for your farm.</p>
      </div>

      {/* Soil Moisture Prediction */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Soil Moisture Prediction (7 days)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={predictionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="hsl(var(--color-primary))" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="hsl(var(--color-accent))"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Crop Yield Prediction */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-lg">Expected Crop Yield (Tons)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={yieldPrediction}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="yield" fill="hsl(var(--color-accent))" stroke="hsl(var(--color-accent))" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Risk Assessment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <span className="text-sm">Drought Risk</span>
              <span className="font-semibold">Low</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <span className="text-sm">Disease Risk</span>
              <span className="font-semibold">Very Low</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="text-sm">Flood Risk</span>
              <span className="font-semibold">Medium</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Optimization Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Increase irrigation on Day 2 for optimal growth</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Expected yield increase of 12% with current irrigation</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Monitor temperature drops after Day 4</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
