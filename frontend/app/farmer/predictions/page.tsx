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

export default function PredictionsPage() {
  // API base (env override or fallback to same origin)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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

  // --- New: realtime socket & auto-predict state ---
  const latestSensorRef = useRef<any | null>(null); // freshest sensor snapshot
  const [latestSensor, setLatestSensor] = useState<any | null>(null); // for UI
  const [rtPredictHistory, setRtPredictHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("rtPredictHistory");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const predictIntervalRef = useRef<number | null>(null);
  const socketRef = useRef<any>(null);
  const [rtPredicting, setRtPredicting] = useState(false);
  // --- end realtime state ---

  // Device selection (prompt modal)
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

  const saveAndJoin = (id: string) => {
    if (!id) return;
    setDeviceId(id);
    try {
      localStorage.setItem("deviceId", id);
    } catch {}
    setShowDeviceModal(false);
    // emit join if socket already connected
    try {
      const s = socketRef.current;
      if (s && s.connected) s.emit("join-device", id);
    } catch {}
  };

  // load prediction history from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("predictHistory");
      if (raw) setPredictHistory(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const saveHistory = (entry: any) => {
    try {
      const next = [entry, ...predictHistory].slice(0, 50);
      setPredictHistory(next);
      localStorage.setItem("predictHistory", JSON.stringify(next));
    } catch (e) {}
  };

  // manual submit (use API_BASE)
  const submitPredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPredictError(null);

    const payload = {
      temperature: Number(predictForm.temperature),
      humidity: Number(predictForm.humidity),
      soil: Number(predictForm.soil),
      ph: Number(predictForm.ph),
      npk: Number(predictForm.npk),
    };

    if (
      [
        payload.temperature,
        payload.humidity,
        payload.soil,
        payload.ph,
        payload.npk,
      ].some((v) => Number.isNaN(v))
    ) {
      setPredictError("Please enter valid numeric values for all fields.");
      return;
    }

    setPredicting(true);
    try {
      const base = API_BASE ? API_BASE.replace(/\/$/, "") : "";
      const url = base ? `${base}/predict` : `/predict`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = `Request failed: ${res.status}`;
        try {
          const body = await res.json();
          if (body?.message) errText = String(body.message);
          else if (body?.error) errText = String(body.error);
          else errText = JSON.stringify(body);
        } catch {
          try {
            const txt = await res.text();
            if (txt) errText = txt;
          } catch {}
        }
        setPredictError(errText);
        return;
      }

      const data = await res.json();
      const entry = {
        id: Date.now(),
        input: payload,
        response: data,
        createdAt: new Date().toISOString(),
      };
      setLatestPrediction(entry);
      saveHistory(entry);
    } catch (err) {
      console.error("Predict request failed", err);
      setPredictError("Prediction request failed. Check server/network.");
    } finally {
      setPredicting(false);
    }
  };

  // --- New: socket connection + 30s auto-predict ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { io } = await import("socket.io-client");
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const socket = io(socketUrl, {
        transports: ["websocket"],
        autoConnect: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("socket connected", socket.id);
        // optionally join stored device room
        try {
          const dev = localStorage.getItem("deviceId");
          if (dev) socket.emit("join-device", dev);
        } catch {}
        // start interval if not started
        if (!predictIntervalRef.current) {
          predictIntervalRef.current = window.setInterval(async () => {
            const sensor = latestSensorRef.current;
            if (!sensor) return;
            const payload = {
              temperature: Number(sensor.temperature),
              humidity: Number(sensor.humidity),
              soil: Number(sensor.soil),
              ph: Number(sensor.ph),
              npk: Number(sensor.npk),
            };
            if (
              [
                payload.temperature,
                payload.humidity,
                payload.soil,
                payload.ph,
                payload.npk,
              ].some((v) => Number.isNaN(v))
            )
              return;
            setRtPredicting(true);
            try {
              const base = API_BASE ? API_BASE.replace(/\/$/, "") : "";
              const url = base ? `${base}/predict` : `/predict`;
              const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              let data;
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
              setRtPredictHistory((prev) => {
                const next = [entry, ...prev].slice(0, 200);
                try {
                  localStorage.setItem(
                    "rtPredictHistory",
                    JSON.stringify(next)
                  );
                } catch {}
                return next;
              });
            } catch (err) {
              console.error("realtime predict failed", err);
            } finally {
              setRtPredicting(false);
            }
          }, 30000); // 30s
        }
      });

      socket.on("device-data", (payload: any) => {
        if (!mounted) return;
        const soilVal =
          typeof payload.soil === "number"
            ? payload.soil
            : payload.soilMoisture ?? null;
        const temp =
          typeof payload.temperature === "number" ? payload.temperature : null;
        const hum =
          typeof payload.humidity === "number" ? payload.humidity : null;
        const ph = typeof payload.ph === "number" ? payload.ph : null;
        const npk = typeof payload.npk === "number" ? payload.npk : null;
        const receivedAt = payload.receivedAt
          ? new Date(payload.receivedAt).toLocaleTimeString()
          : new Date().toLocaleTimeString();

        const snapshot = {
          temperature: temp,
          humidity: hum,
          soil: soilVal,
          ph,
          npk,
          receivedAt,
        };
        latestSensorRef.current = snapshot;
        setLatestSensor(snapshot);

        // optionally update small charts or UI here (omitted for brevity)
      });

      socket.on("disconnect", () => {
        console.log("socket disconnected");
      });
    })();

    return () => {
      mounted = false;
      try {
        if (predictIntervalRef.current) {
          clearInterval(predictIntervalRef.current);
          predictIntervalRef.current = null;
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      } catch {}
    };
  }, [API_BASE]);

  // UI render: reuse existing charts and add realtime panel + realtime history
  return (
    <div className="p-4 md:p-8 space-y-8">
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

      {/* Soil Moisture Prediction */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">
            Soil Moisture Prediction (7 days)
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={predictionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--color-primary))"
              strokeWidth={2}
            />
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
            <Area
              type="monotone"
              dataKey="yield"
              fill="hsl(var(--color-accent))"
              stroke="hsl(var(--color-accent))"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Predict form + history (modern UI) */}
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
