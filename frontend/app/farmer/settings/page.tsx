"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="John Martinez" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" defaultValue="+1 (555) 123-4567" />
          </div>
          <Button>Save Changes</Button>
        </div>
      </Card>

      <Separator />

      {/* Farm Information */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Farm Information</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="farmName">Farm Name</Label>
            <Input id="farmName" defaultValue="Martinez Agriculture" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="farmSize">Farm Size (acres)</Label>
            <Input id="farmSize" type="number" defaultValue="250" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" defaultValue="Kansas, USA" />
          </div>
          <Button>Save Changes</Button>
        </div>
      </Card>

      <Separator />

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-sm text-muted-foreground">Receive critical farm alerts</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Daily Reports</p>
              <p className="text-sm text-muted-foreground">Get daily farm summary emails</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Weather Updates</p>
              <p className="text-sm text-muted-foreground">Receive weather notifications</p>
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
            <p className="text-sm text-muted-foreground mb-3">Delete your account and all associated data</p>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
