"use client";

import { Card } from "@/components/ui/card";
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
} from "recharts";
import { Users, MapPin, Droplets, TrendingUp, AlertCircle } from "lucide-react";
import BlogManager from "@/components/admin/BlogManager";
import { Provider } from "react-redux";
import { store } from "@/store";

const platformData = [
  { month: "Jan", farmers: 120, farms: 280 },
  { month: "Feb", farmers: 145, farms: 310 },
  { month: "Mar", farmers: 168, farms: 340 },
  { month: "Apr", farmers: 192, farms: 385 },
  { month: "May", farmers: 215, farms: 420 },
];

const waterSavingsData = [
  { name: "Saved", value: 2850000 },
  { name: "Target", value: 3000000 },
];

const COLORS = ["hsl(var(--color-primary))", "hsl(var(--color-accent))"];

export default function AdminOverview() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground">
          Platform performance and system metrics.
        </p>
      </div>

      {/* Alert */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            System Update
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Platform maintenance scheduled for this weekend
          </p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Farmers</p>
              <p className="text-3xl font-bold">215</p>
              <p className="text-xs text-green-600 mt-1">+12% this month</p>
            </div>
            <Users className="w-10 h-10 text-primary/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Farms</p>
              <p className="text-3xl font-bold">420</p>
              <p className="text-xs text-green-600 mt-1">+9% this month</p>
            </div>
            <MapPin className="w-10 h-10 text-accent/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Water Saved</p>
              <p className="text-3xl font-bold">2.8M L</p>
              <p className="text-xs text-green-600 mt-1">95% of target</p>
            </div>
            <Droplets className="w-10 h-10 text-blue-500/30" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Efficiency</p>
              <p className="text-3xl font-bold">87%</p>
              <p className="text-xs text-green-600 mt-1">
                ↑ 3% from last month
              </p>
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
              <Line
                type="monotone"
                dataKey="farms"
                stroke="hsl(var(--color-accent))"
                strokeWidth={2}
                name="Farms"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Water Savings Pie Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Water Savings Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={waterSavingsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {waterSavingsData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-muted-foreground mt-4">
            2.85M / 3M Liters (95%)
          </p>
        </Card>
      </div>

      {/* System Health */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">API Uptime</p>
            <p className="text-2xl font-bold text-green-600">99.9%</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Avg Response Time
            </p>
            <p className="text-2xl font-bold text-green-600">145ms</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Active Alerts</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
        </div>
      </Card>

      {/* Manage Blogs section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Content — Manage Blogs</h2>
          <div className="text-sm text-muted-foreground">Admin tools</div>
        </div>

        {/* Redux Provider locally for admin page */}
        <Provider store={store}>
          <BlogManager />
        </Provider>
      </Card>
    </div>
  );
}
