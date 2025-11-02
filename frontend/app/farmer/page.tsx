"use client";
import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/alerts-notifications";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Droplets,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Replace static data with stateful data that will be updated by realtime events
const INITIAL_MOISTURE = [
  { time: "12:00", moisture: 45 },
  { time: "1:00", moisture: 48 },
  { time: "2:00", moisture: 52 },
  { time: "3:00", moisture: 58 },
  { time: "4:00", moisture: 55 },
  { time: "5:00", moisture: 50 },
];

// replace INITIAL_WATER_USAGE with temperature initial series
const INITIAL_TEMPERATURE = [
  { time: "12:00", temperature: 22 },
  { time: "13:00", temperature: 23 },
  { time: "14:00", temperature: 24 },
  { time: "15:00", temperature: 23 },
  { time: "16:00", temperature: 22 },
];

// Use the realtime singleton manager to keep socket alive across pages
import {
  init as initRealtime,
  subscribe as subscribeRealtime,
  setDeviceId as realtimeSetDeviceId,
  getState as realtimeGetState,
} from "@/lib/realtime";

export default function FarmerDashboard() {
  // Config: adjust for your environment
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "https://smartirrigationsystems.onrender.com";

  // API base (use explicit API url if provided, otherwise fallback to socket url)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || SOCKET_URL;

  // deviceId is chosen by the user via modal or loaded from localStorage
  const [deviceId, setDeviceId] = useState<string>("");
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [deviceInput, setDeviceInput] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // load saved deviceId on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("deviceId");
      if (saved) {
        setDeviceId(saved);
        setDeviceInput(saved);
        setShowDeviceModal(false);
      } else {
        setShowDeviceModal(true);
      }
    } catch (e) {
      setShowDeviceModal(true);
    }
  }, []);

  // initialize and subscribe to global realtime manager
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      await initRealtime({ socketUrl: SOCKET_URL });
      // subscribe to updates
      unsub = subscribeRealtime((s: any) => {
        // update local UI state from global state
        if (s.latest) {
          setLatest({
            temperature: s.latest.temperature ?? null,
            humidity: s.latest.humidity ?? null,
            soil: s.latest.soil ?? null,
            ph: s.latest.ph ?? null,
            npk: s.latest.npk ?? null,
            pump: s.latest.pump ?? null,
            receivedAt: s.latest.receivedAt ?? null,
          });
        }
        if (Array.isArray(s.moistureData)) setMoistureData(s.moistureData);
        if (Array.isArray(s.temperatureData))
          setTemperatureData(s.temperatureData);
        // keep connection flag
        setConnected(Boolean(s.connected));
      });
    })();

    return () => {
      // do not disconnect the global socket; just unsubscribe
      if (unsub) unsub();
    };
  }, [SOCKET_URL]);

  // when user saves/join device, inform global manager
  const saveAndJoin = (id: string) => {
    if (!id) return;
    setDeviceId(id);
    try {
      localStorage.setItem("deviceId", id);
    } catch (e) {}
    setShowDeviceModal(false);
    // emit join via global manager
    try {
      realtimeSetDeviceId(id);
    } catch (e) {}
  };

  // QR scan helpers using BarcodeDetector (if supported)
  const startScan = async () => {
    if (isScanningRef.current) return;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      alert("Camera access not supported in this browser.");
      return;
    }
    // BarcodeDetector API
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (!BarcodeDetectorClass) {
      alert(
        "QR scanning not supported in this browser. Please enter device id manually."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = document.createElement("video");
      videoRef.current = video;
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();

      detectorRef.current = new BarcodeDetectorClass({ formats: ["qr_code"] });
      isScanningRef.current = true;

      // poll detector
      scanIntervalRef.current = window.setInterval(async () => {
        try {
          const detections = await detectorRef.current.detect(video);
          if (detections && detections.length) {
            const raw =
              detections[0].rawValue ||
              detections[0].rawData ||
              detections[0].raw;
            if (raw) {
              // found code
              stopScan();
              setDeviceInput(String(raw));
              saveAndJoin(String(raw));
            }
          }
        } catch (err) {
          // ignore detection errors
        }
      }, 500);
    } catch (err) {
      alert("Failed to access camera for scanning.");
    }
  };

  const stopScan = () => {
    try {
      isScanningRef.current = false;
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      const video = videoRef.current;
      if (video && video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    } catch (e) {}
  };

  // Logged-in user state (reads fallback from localStorage key "userName")
  const [user, setUser] = useState<{ name: string }>({ name: "John" });
  useEffect(() => {
    try {
      const name = localStorage.getItem("userName");
      if (name) setUser({ name });
    } catch (e) {
      // ignore
    }
  }, []);

  // state for charts / stats
  const [moistureData, setMoistureData] = useState(INITIAL_MOISTURE);
  const [temperatureData, setTemperatureData] = useState(INITIAL_TEMPERATURE);

  // Prediction form + history
  const [predictForm, setPredictForm] = useState({
    temperature: "",
    humidity: "",
    soil: "",
    ph: "",
    npk: "",
  });
  const [predicting, setPredicting] = useState(false);
  const [latestPrediction, setLatestPrediction] = useState<any | null>(null);
  const [predictHistory, setPredictHistory] = useState<any[]>([]);

  // load prediction history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("predictHistory");
      if (raw) setPredictHistory(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const saveHistory = (entry: any) => {
    try {
      const next = [entry, ...predictHistory].slice(0, 50);
      setPredictHistory(next);
      localStorage.setItem("predictHistory", JSON.stringify(next));
    } catch (e) {}
  };

  // submit prediction to API
  const submitPredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // basic conversion
    const payload = {
      temperature: Number(predictForm.temperature),
      humidity: Number(predictForm.humidity),
      soil: Number(predictForm.soil),
      ph: Number(predictForm.ph),
      npk: Number(predictForm.npk),
    };
    // validate
    if (
      [
        payload.temperature,
        payload.humidity,
        payload.soil,
        payload.ph,
        payload.npk,
      ].some((v) => Number.isNaN(v))
    ) {
      alert("Please enter valid numeric values for all fields.");
      return;
    }

    setPredicting(true);
    try {
      const res = await fetch(`http://localhost:5000/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const entry = {
        id: Date.now(),
        deviceId: deviceId || null,
        input: payload,
        response: data,
        createdAt: new Date().toISOString(),
      };
      setLatestPrediction(entry);
      saveHistory(entry);
      // optional: reset form or keep values
    } catch (err) {
      console.error("Predict request failed", err);
      alert("Prediction request failed. Check server and network.");
    } finally {
      setPredicting(false);
    }
  };

  const [latest, setLatest] = useState({
    temperature: null as number | null,
    humidity: null as number | null,
    soil: null as number | null,
    ph: null as number | null,
    npk: null as number | null,
    pump: null as number | null, // 1 = on, 0 = off
    receivedAt: null as string | null,
  });
  const [connected, setConnected] = useState(false);

  // when deviceId changes, inform the global realtime manager to join the device
  useEffect(() => {
    if (!deviceId) return;
    try {
      // global manager will handle socket state and emitting join
      realtimeSetDeviceId(deviceId);
    } catch (e) {
      // ignore errors from manager
    }
  }, [deviceId]);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Device selection modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Enter Device ID</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Type the device id or scan QR to join realtime updates.
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
                onClick={startScan}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Scan QR
              </button>
              <button
                onClick={() => {
                  setShowDeviceModal(false);
                }}
                className="px-4 py-2 bg-red-100 rounded"
              >
                Close
              </button>
            </div>
            <div className="mt-3">
              {/* video preview for scanning (hidden until camera active) */}
              <div
                id="qr-preview"
                className="w-full h-40 bg-black/5 rounded overflow-hidden flex items-center justify-center"
              >
                {/* Note: we don't append the <video> DOM here; startScan creates the video element */}
                <p className="text-sm text-muted-foreground">
                  When scanning, allow camera access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Here's your overview.
          </p>
        </div>
        <div className="text-sm">
          <span className={connected ? "text-green-600" : "text-red-600"}>
            {connected ? "Realtime: connected" : "Realtime: disconnected"}
          </span>
        </div>
      </div>

      {/* Alerts */}
      <Alert
        type="info"
        title="Weather Alert"
        message="Rain expected tomorrow morning. Consider reducing irrigation."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Soil Moisture</p>
              <p className="text-2xl font-bold">
                {latest.soil !== null ? `${latest.soil}%` : "—"}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {latest.soil !== null ? "Live reading" : "No data"}
              </p>
            </div>
            <Droplets className="w-10 h-10 text-primary/30" />
          </div>
        </Card>

        {/* Realtime metric: Temperature */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Temperature</p>
              <p className="text-2xl font-bold">
                {latest.temperature !== null ? `${latest.temperature}°C` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {latest.receivedAt ? `Last: ${latest.receivedAt}` : "No data"}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-red-500/30" />
          </div>
        </Card>

        {/* Realtime metric: Humidity */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Humidity</p>
              <p className="text-2xl font-bold">
                {latest.humidity !== null ? `${latest.humidity}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {latest.receivedAt ? `Last: ${latest.receivedAt}` : "No data"}
              </p>
            </div>
            <Zap className="w-10 h-10 text-accent/30" />
          </div>
        </Card>

        {/* Realtime metric: pH */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">pH</p>
              <p className="text-2xl font-bold">
                {latest.ph !== null ? `${latest.ph}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {latest.receivedAt ? `Last: ${latest.receivedAt}` : "No data"}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600/30" />
          </div>
        </Card>

        {/* Realtime metric: Pump */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pump</p>
              <p className="text-2xl font-bold">
                {latest.pump === 1 ? (
                  <span className="text-green-600">On</span>
                ) : latest.pump === 0 ? (
                  <span className="text-red-600">Off</span>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {latest.receivedAt ? `Last: ${latest.receivedAt}` : "No data"}
              </p>
            </div>
            <CheckCircle
              className={`w-10 h-10 ${
                latest.pump === 1 ? "text-green-500/30" : "text-red-500/30"
              }`}
            />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Soil Moisture Trend</h2>
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

        {/* Temperature Trend (realtime) */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Temperature Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
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
      </div>

      {/* Predict form + history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 lg:col-span-2">
          <h2 className="font-semibold text-lg mb-4">
            Crop & Water Prediction
          </h2>
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
                onClick={() => {
                  setPredictForm({
                    temperature: "",
                    humidity: "",
                    soil: "",
                    ph: "",
                    npk: "",
                  });
                }}
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
          </form>

          {/* Latest prediction result */}
          {latestPrediction && (
            <div className="mt-4 p-4 bg-muted/30 rounded">
              <div className="font-medium">Latest prediction</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  Crop:{" "}
                  <strong>
                    {latestPrediction.response?.predicted_crop || "—"}
                  </strong>
                </div>
                <div>
                  Water need:{" "}
                  <strong>
                    {typeof latestPrediction.response?.predicted_water_need ===
                    "number"
                      ? latestPrediction.response.predicted_water_need.toFixed(
                          2
                        )
                      : latestPrediction.response?.predicted_water_need ?? "—"}
                  </strong>
                </div>
                <div>
                  Status:{" "}
                  <strong>{latestPrediction.response?.status ?? "—"}</strong>
                </div>
                <div>
                  Device: <strong>{latestPrediction.deviceId || "—"}</strong>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* History column */}
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Prediction History</h3>
          {predictHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No predictions yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto">
              {predictHistory.map((h) => (
                <div key={h.id} className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm">
                    <div>
                      Crop: <strong>{h.response?.predicted_crop || "—"}</strong>
                    </div>
                    <div>
                      Water:{" "}
                      <strong>
                        {typeof h.response?.predicted_water_need === "number"
                          ? h.response.predicted_water_need.toFixed(2)
                          : h.response?.predicted_water_need ?? "—"}
                      </strong>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {h.response?.status ?? "—"}
                    </div>
                  </div>
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Inputs</summary>
                    <pre className="text-xs mt-1">
                      {JSON.stringify(h.input, null, 2)}
                    </pre>
                    <pre className="text-xs mt-1">
                      Response: {JSON.stringify(h.response)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">AI Recommendations</h2>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Irrigation schedule optimized</p>
              <p className="text-sm text-muted-foreground">
                Reduce morning irrigation by 10% to save water
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Temperature alert</p>
              <p className="text-sm text-muted-foreground">
                Expected temperature drop may affect crop growth
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
