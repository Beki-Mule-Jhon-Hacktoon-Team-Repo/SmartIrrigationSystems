"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function AdminSettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and policies.</p>
      </div>

      {/* Platform Configuration */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Platform Configuration</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minFarmSize">Minimum Farm Size (acres)</Label>
            <Input id="minFarmSize" type="number" defaultValue="50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trialDays">Free Trial Duration (days)</Label>
            <Input id="trialDays" type="number" defaultValue="14" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDevices">Maximum Devices Per Farm</Label>
            <Input id="maxDevices" type="number" defaultValue="20" />
          </div>
          <Button>Save Configuration</Button>
        </div>
      </Card>

      <Separator />

      {/* System Features */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">System Features</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">AI Recommendations</p>
              <p className="text-sm text-muted-foreground">Enable AI-powered suggestions for farmers</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Weather Alerts</p>
              <p className="text-sm text-muted-foreground">Send real-time weather notifications</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Analytics Dashboard</p>
              <p className="text-sm text-muted-foreground">Allow farmers to view analytics</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      <Separator />

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">System Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Alert Failed Devices</p>
              <p className="text-sm text-muted-foreground">Notify on device connectivity issues</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">System Maintenance</p>
              <p className="text-sm text-muted-foreground">Notify users of scheduled maintenance</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/30 bg-destructive/5">
        <h2 className="font-semibold text-lg mb-4 text-destructive">Danger Zone</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Clear all cached data and reset analytics</p>
            <Button variant="destructive">Clear Cache</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
