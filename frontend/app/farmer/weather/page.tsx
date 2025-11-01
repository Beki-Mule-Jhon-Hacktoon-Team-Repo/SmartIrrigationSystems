"use client"

import { Card } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react"

const weatherForecast = [
  { day: "Today", high: 28, low: 15, condition: "Sunny", icon: Sun, chance: 0 },
  { day: "Tomorrow", high: 26, low: 14, condition: "Partly Cloudy", icon: Cloud, chance: 10 },
  { day: "Day 3", high: 22, low: 12, condition: "Rainy", icon: CloudRain, chance: 80 },
  { day: "Day 4", high: 20, low: 10, condition: "Cloudy", icon: Cloud, chance: 30 },
  { day: "Day 5", high: 25, low: 13, condition: "Sunny", icon: Sun, chance: 5 },
]

export default function WeatherPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Weather Feed</h1>
        <p className="text-muted-foreground">7-day weather forecast for your farm.</p>
      </div>

      {/* Current Weather */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground mb-2">Current Weather</p>
            <p className="text-5xl font-bold text-foreground mb-2">28°C</p>
            <p className="text-lg text-muted-foreground">Sunny and clear</p>
          </div>
          <Sun className="w-24 h-24 text-accent" />
        </div>
      </Card>

      {/* Weather Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wind className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Wind Speed</p>
          </div>
          <p className="text-2xl font-bold">12 km/h</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-5 h-5 text-accent" />
            <p className="text-sm text-muted-foreground">Humidity</p>
          </div>
          <p className="text-2xl font-bold">65%</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CloudRain className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-muted-foreground">Rainfall Chance</p>
          </div>
          <p className="text-2xl font-bold">10%</p>
        </Card>
      </div>

      {/* 5-Day Forecast */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">5-Day Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {weatherForecast.map((day, i) => {
            const IconComponent = day.icon
            return (
              <div key={i} className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="font-medium mb-3">{day.day}</p>
                <IconComponent className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">{day.condition}</p>
                <div className="flex justify-center gap-2 mb-2">
                  <span className="font-semibold">{day.high}°</span>
                  <span className="text-muted-foreground">{day.low}°</span>
                </div>
                <p className="text-xs text-muted-foreground">💧 {day.chance}%</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
