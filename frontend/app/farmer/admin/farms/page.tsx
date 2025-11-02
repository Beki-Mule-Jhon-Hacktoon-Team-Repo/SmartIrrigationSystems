"use client"

import React, { useEffect, useState } from "react"
import { useAppSelector } from "@/store/hooks"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Droplets, MapPin } from "lucide-react"

type FarmShape = {
  id: string | number
  name: string
  farmer: string
  size: string
  location: string
  waterSaved: string
  status: string
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmShape[]>([])
  const [loading, setLoading] = useState(false)
  const token = useAppSelector((s) => (s.auth && s.auth.idToken) || null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    owner: "",
    location: "",
    size: "",
    litresSaved: "",
    status: "Active",
    description: "",
  })

  const getApiBase = () =>
    (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL !== "")
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : typeof window !== "undefined"
      ? window.location.origin.replace(/:3000$/, ":5001")
      : "http://localhost:5001";

  const fetchFarms = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${getApiBase()}/api/v1/farm`)
      if (!res.ok) throw new Error(`Failed to fetch farms (${res.status})`)
      const body = await res.json().catch(() => ({}))
      const docs = body?.data?.farms || []
      const mapped = docs.map((d: any) => ({
        id: d._id || d.id || Math.random(),
        name: d.name || "Unnamed Farm",
        farmer: (d.owner && d.owner.name) || d.ownerName || "—",
        size: d.size ? `${d.size} acres` : "—",
        location: d.location || "—",
        waterSaved: typeof d.litresSaved === "number" ? `${Math.round(d.litresSaved)} L` : (d.litresSaved || "—"),
        status: d.status || "Unknown",
      }))
      setFarms(mapped)
    } catch (err) {
      console.error("fetchFarms error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFarms(); /* eslint-disable-next-line */ }, [])

  const openAdd = () => {
    setForm({ name: "", owner: "", location: "", size: "", litresSaved: "", status: "Active", description: "" })
    setModalOpen(true)
  }

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        owner: form.owner || undefined,
        location: form.location,
        size: form.size ? Number(form.size) : undefined,
        litresSaved: form.litresSaved ? Number(form.litresSaved) : undefined,
        status: form.status,
        description: form.description,
      }
      const res = await fetch(`${getApiBase()}/api/v1/farm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `Create failed ${res.status}`)
      }
      setModalOpen(false)
      setForm({ name: "", owner: "", location: "", size: "", litresSaved: "", status: "Active", description: "" })
      await fetchFarms()
    } catch (err) {
      console.error("create farm error:", err)
      try { alert("Create farm failed (see console)"); } catch (_) {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farms</h1>
          <p className="text-muted-foreground">Manage all registered farms and their devices.</p>
        </div>
        <Button onClick={openAdd}>Add Farm</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search farms..." className="pl-10" />
      </div>

      {loading ? (
        <div className="text-center p-6 text-muted-foreground">Loading farms…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((farm) => (
            <Card key={farm.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{farm.name}</h3>
                  <p className="text-sm text-muted-foreground">{farm.farmer}</p>
                </div>
                <button className="p-1 hover:bg-muted rounded-lg">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{farm.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{farm.size}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{farm.waterSaved} saved</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    farm.status === "Active"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100"
                      : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100"
                  }`}
                >
                  {farm.status}
                </span>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Farm Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">Add Farm</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Farm Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter farm name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Owner</label>
                <Input
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  placeholder="Enter owner's name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Enter farm location"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Size (acres)</label>
                <Input
                  type="number"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="Enter farm size"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Water Saved (L)</label>
                <Input
                  type="number"
                  value={form.litresSaved}
                  onChange={(e) => setForm({ ...form, litresSaved: e.target.value })}
                  placeholder="Enter water saved"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full p-2 text-sm rounded-md border focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter farm description"
                  className="w-full p-2 text-sm rounded-md border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {loading ? "Creating..." : "Create Farm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
