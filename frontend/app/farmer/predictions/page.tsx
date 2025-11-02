"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
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
} from "recharts";
import { Brain, TrendingUp } from "lucide-react";
import Link from "next/link";

const predictionData = [
  { day: "Today", actual: 55, predicted: 55 },
  { day: "+1 day", actual: null, predicted: 58 },
  { day: "+2 days", actual: null, predicted: 62 },
  { day: "+3 days", actual: null, predicted: 59 },
  { day: "+4 days", actual: null, predicted: 56 },
  { day: "+5 days", actual: null, predicted: 54 },
];

const yieldPrediction = [
  { month: "Jan", yield: 100 },
  { month: "Feb", yield: 150 },
  { month: "Mar", yield: 200 },
  { month: "Apr", yield: 280 },
  { month: "May", yield: 350 },
];

// Realtime manager
import {
  init as initRealtime,
  subscribe as subscribeRealtime,
  setDeviceId as realtimeSetDeviceId,
} from "@/lib/realtime";

export default function PredictionsPage() {
  // API base (env override or fallback to same origin)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // helper: build prediction payload from a sensor snapshot (use only selected fields)
  const buildPredictPayload = (sensor: any) => {
    if (!sensor) return null;
    const temperature =
      sensor.temperature != null ? Number(sensor.temperature) : NaN;
    const humidity = sensor.humidity != null ? Number(sensor.humidity) : NaN;
    const soil = sensor.soil != null ? Number(sensor.soil) : NaN;
    return { temperature, humidity, soil };
  };

  // Prediction form + history state
  const [predictForm, setPredictForm] = useState({
    temperature: "",
    humidity: "",
    soil: "",
    ph: "",
    npk: "",
  });
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<any | null>(null);
  const [predictHistory, setPredictHistory] = useState<any[]>([]);

  // realtime state (local mirrors)
  const [latestSensor, setLatestSensor] = useState<any | null>(null);
  const latestSensorRef = useRef<any | null>(null);
  const [moistureData, setMoistureData] = useState<any[]>([
    { time: "12:00", moisture: 45 },
    { time: "1:00", moisture: 48 },
    { time: "2:00", moisture: 52 },
  ]);
  const [temperatureData, setTemperatureData] = useState<any[]>([
    { time: "12:00", temperature: 22 },
    { time: "13:00", temperature: 23 },
  ]);
  const [rtPredictHistory, setRtPredictHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("rtPredictHistory");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [rtPredicting, setRtPredicting] = useState(false);

  // device modal state (existing)
  const [deviceId, setDeviceId] = useState<string>(() => {
    try {
      return localStorage.getItem("deviceId") || "";
    } catch {
      return "";
    }
  });
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("deviceId");
    } catch {
      return true;
    }
  });
  const [deviceInput, setDeviceInput] = useState<string>(deviceId);

  // save & join should inform realtime manager
  const saveAndJoin = (id: string) => {
    if (!id) return;
    setDeviceId(id);
    try {
      localStorage.setItem("deviceId", id);
    } catch {}
    setShowDeviceModal(false);
    try {
      realtimeSetDeviceId(id);
    } catch {}
  };

  // subscribe to realtime manager and init once
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      await initRealtime({
        socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "",
      });
      unsub = subscribeRealtime((s: any) => {
        if (s.latest) {
          latestSensorRef.current = s.latest;
          setLatestSensor(s.latest);
        }
        if (Array.isArray(s.moistureData)) setMoistureData(s.moistureData);
        if (Array.isArray(s.temperatureData))
          setTemperatureData(s.temperatureData);
      });
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // 30s auto-predict using freshest snapshot
  useEffect(() => {
    let mounted = true;
    const doPredict = async () => {
      const sensor = latestSensorRef.current;
      if (!sensor) return;
      const payload = buildPredictPayload(sensor);
      if (!payload) return;
      if (
        [payload.temperature, payload.humidity, payload.soil].some((v) =>
          Number.isNaN(v)
        )
      )
        return;
      setRtPredicting(true);
      try {
        const base = API_BASE ? API_BASE.replace(/\/$/, "") : "";
        const url = "http://localhost:5000/predict";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = { status: "error", message: "invalid json" };
        }
        const entry = {
          id: Date.now(),
          input: payload,
          response: data,
          createdAt: new Date().toISOString(),
        };
        if (!mounted) return;
        setRtPredictHistory((prev) => {
          const next = [entry, ...prev].slice(0, 200);
          try {
            localStorage.setItem("rtPredictHistory", JSON.stringify(next));
          } catch {}
          return next;
        });
      } catch (err) {
        console.error("rt predict failed", err);
      } finally {
        if (mounted) setRtPredicting(false);
      }
    };

    // run first after small delay then every 30s
    const timeout = window.setTimeout(() => doPredict(), 3000);
    const interval = window.setInterval(() => doPredict(), 30000);
    return () => {
      mounted = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [API_BASE]);

  async function submitPredict(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (predicting) return;
    setPredictError(null);
    setPredicting(true);

    try {
      const temperature = Number(predictForm.temperature);
      const humidity = Number(predictForm.humidity);
      const soil = Number(predictForm.soil);
      const ph = Number(predictForm.ph);
      const npk = Number(predictForm.npk);

      if ([temperature, humidity, soil, ph, npk].some((v) => Number.isNaN(v))) {
        setPredictError("Please provide valid numeric values for all fields.");
        setPredicting(false);
        return;
      }

      const payload = { temperature, humidity, soil, ph, npk };

      const base = API_BASE ? API_BASE.replace(/\/$/, "") : "";
      const url = "http://localhost:5000/predict";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = { status: "error", message: "invalid json" };
      }

      const entry = {
        id: Date.now(),
        input: payload,
        response: data,
        createdAt: new Date().toISOString(),
      };

      setLatestPrediction(entry);
      setPredictHistory((prev) => {
        const next = [entry, ...prev].slice(0, 200);
        try {
          localStorage.setItem("predictHistory", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err: any) {
      console.error("predict failed", err);
      setPredictError(String(err?.message ?? err));
    } finally {
      setPredicting(false);
    }
  }

  // UI render — reuse existing layout but source data from local realtime mirrors (moistureData, temperatureData, rtPredictHistory)
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="text-sm text-muted-foreground">
        Realtime predict fields: <strong>temperature, humidity, soil</strong>
      </div>

      {/* Device selection modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Enter Device ID</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Type your device id to receive realtime updates.
            </p>
            <input
              value={deviceInput}
              onChange={(e) => setDeviceInput(e.target.value)}
              className="w-full border p-2 rounded mb-3"
              placeholder="DEVICE123"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveAndJoin(deviceInput.trim())}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Join
              </button>
              <button
                onClick={() => setShowDeviceModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Predictions</h1>
        <p className="text-muted-foreground">
          AI-powered insights for your farm.
        </p>
      </div>
      {/* quick device display / change */}
      <div className="flex items-center justify-end">
        <div className="text-sm text-muted-foreground mr-2">Device:</div>
        <div className="text-sm font-medium mr-4">{deviceId || "Not set"}</div>
        <button
          onClick={() => {
            setDeviceInput(deviceId || "");
            setShowDeviceModal(true);
          }}
          className="text-xs px-2 py-1 border rounded"
        >
          Change
        </button>
      </div>

      {/* Realtime prediction panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">
              Realtime prediction (auto every 30s)
            </div>
            <div className="text-2xl font-bold mt-1">
              {rtPredictHistory[0]?.response?.predicted_crop ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Water:{" "}
              {typeof rtPredictHistory[0]?.response?.predicted_water_need ===
              "number"
                ? rtPredictHistory[0].response.predicted_water_need.toFixed(2)
                : "—"}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {rtPredicting
              ? "Predicting..."
              : `${rtPredictHistory.length} records`}
          </div>
        </div>
      </Card>

      {/* Soil moisture chart uses moistureData */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Soil Moisture (Realtime)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={moistureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="moisture"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Temperature chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-lg">Temperature (Realtime)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={temperatureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Manual predict form + history — keep existing form markup but data may come from local state */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-6 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Crop & Water Prediction</h2>
            <div className="text-sm text-muted-foreground">
              API:{" "}
              <code className="px-2 py-1 rounded bg-slate-50 text-xs">
                {API_BASE || "relative /predict"}
              </code>
            </div>
          </div>

          <form onSubmit={submitPredict} className="grid grid-cols-2 gap-3">
            <label className="col-span-1">
              <div className="text-sm text-muted-foreground">
                Temperature (°C)
              </div>
              <input
                type="number"
                step="0.1"
                className="w-full mt-1 p-2 border rounded"
                value={predictForm.temperature}
                onChange={(e) =>
                  setPredictForm({
                    ...predictForm,
                    temperature: e.target.value,
                  })
                }
                required
              />
            </label>

            <label className="col-span-1">
              <div className="text-sm text-muted-foreground">Humidity (%)</div>
              <input
                type="number"
                step="0.1"
                className="w-full mt-1 p-2 border rounded"
                value={predictForm.humidity}
                onChange={(e) =>
                  setPredictForm({ ...predictForm, humidity: e.target.value })
                }
                required
              />
            </label>

            <label className="col-span-1">
              <div className="text-sm text-muted-foreground">Soil (%)</div>
              <input
                type="number"
                step="0.1"
                className="w-full mt-1 p-2 border rounded"
                value={predictForm.soil}
                onChange={(e) =>
                  setPredictForm({ ...predictForm, soil: e.target.value })
                }
                required
              />
            </label>

            <label className="col-span-1">
              <div className="text-sm text-muted-foreground">pH</div>
              <input
                type="number"
                step="0.1"
                className="w-full mt-1 p-2 border rounded"
                value={predictForm.ph}
                onChange={(e) =>
                  setPredictForm({ ...predictForm, ph: e.target.value })
                }
                required
              />
            </label>

            <label className="col-span-1">
              <div className="text-sm text-muted-foreground">NPK</div>
              <input
                type="number"
                step="1"
                className="w-full mt-1 p-2 border rounded"
                value={predictForm.npk}
                onChange={(e) =>
                  setPredictForm({ ...predictForm, npk: e.target.value })
                }
                required
              />
            </label>

            <div className="col-span-2 flex gap-2 items-center mt-2">
              <button
                type="submit"
                disabled={predicting}
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
              >
                {predicting ? "Predicting..." : "Predict"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPredictForm({
                    temperature: "",
                    humidity: "",
                    soil: "",
                    ph: "",
                    npk: "",
                  })
                }
                className="px-4 py-2 border rounded"
              >
                Clear
              </button>

              <div className="ml-auto text-sm text-muted-foreground">
                {latestPrediction
                  ? `Last: ${new Date(
                      latestPrediction.createdAt
                    ).toLocaleString()}`
                  : ""}
              </div>
            </div>

            {predictError && (
              <div className="col-span-2 mt-2 text-sm text-red-600">
                {predictError}
              </div>
            )}
          </form>

          {/* Latest prediction result */}
          {latestPrediction && (
            <div className="mt-4 p-4 bg-muted/30 rounded border">
              <div className="flex items-center justify-between">
                <div className="font-medium">Latest prediction</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(latestPrediction.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="p-3 bg-white rounded border">
                  <div className="text-xs text-muted-foreground">Crop</div>
                  <div className="font-semibold text-lg">
                    {latestPrediction.response?.predicted_crop ?? "—"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded border">
                  <div className="text-xs text-muted-foreground">
                    Water need
                  </div>
                  <div className="font-semibold text-lg">
                    {typeof latestPrediction.response?.predicted_water_need ===
                    "number"
                      ? latestPrediction.response.predicted_water_need.toFixed(
                          2
                        )
                      : String(
                          latestPrediction.response?.predicted_water_need ?? "—"
                        )}
                  </div>
                </div>

                <div className="p-3 bg-white rounded border">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div
                    className={`font-semibold ${
                      latestPrediction.response?.status === "success"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {latestPrediction.response?.status ?? "—"}
                  </div>
                </div>
              </div>

              <details className="mt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer">
                  View inputs & full response
                </summary>
                <pre className="text-xs mt-2 bg-slate-50 p-2 rounded">
                  {JSON.stringify(latestPrediction.input, null, 2)}
                </pre>
                <pre className="text-xs mt-2 bg-slate-50 p-2 rounded">
                  Response: {JSON.stringify(latestPrediction.response, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </Card>

        {/* History column (cool UI) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Prediction History</h3>
            <button
              onClick={() => {
                if (!confirm("Clear prediction history?")) return;
                setPredictHistory([]);
                localStorage.removeItem("predictHistory");
              }}
              className="text-xs text-red-600"
            >
              Clear
            </button>
          </div>

          {predictHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No predictions yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
              {predictHistory.map((h) => (
                <div
                  key={h.id}
                  className="flex gap-3 p-3 bg-white rounded border items-start"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-sm font-semibold">
                    {new Date(h.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {h.response?.predicted_crop ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="text-xs text-muted-foreground">Water</div>
                      <div className="font-semibold">
                        {typeof h.response?.predicted_water_need === "number"
                          ? h.response.predicted_water_need.toFixed(2)
                          : String(h.response?.predicted_water_need ?? "—")}
                      </div>
                      <span
                        className={`ml-auto px-2 py-0.5 rounded text-xs ${
                          h.response?.status === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {h.response?.status ?? "—"}
                      </span>
                    </div>

                    <details className="mt-2 text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="text-xs mt-2 bg-slate-50 p-2 rounded">
                        {JSON.stringify(h.input, null, 2)}
                      </pre>
                      <pre className="text-xs mt-2 bg-slate-50 p-2 rounded">
                        Response: {JSON.stringify(h.response, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Insights (existing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Risk Assessment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm">Drought Risk</span>
              <span className="font-semibold">Low</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm">Disease Risk</span>
              <span className="font-semibold">Very Low</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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
              <span>
                Expected yield increase of 12% with current irrigation
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Monitor temperature drops after Day 4</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
