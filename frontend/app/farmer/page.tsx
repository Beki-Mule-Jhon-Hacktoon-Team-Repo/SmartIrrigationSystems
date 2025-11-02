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

export default function FarmerDashboard() {
  // Config: adjust for your environment
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
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

  const saveAndJoin = (id: string) => {
    if (!id) return;
    setDeviceId(id);
    try {
      localStorage.setItem("deviceId", id);
    } catch (e) {}
    setShowDeviceModal(false);
    // emit join if socket already connected
    try {
      const s = socketRef.current;
      if (s && s.connected) s.emit("join-device", id);
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

  const [latest, setLatest] = useState({
    temperature: null as number | null,
    humidity: null as number | null,
    soil: null as number | null,
    ph: null as number | null,
    npk: null as number | null,
    receivedAt: null as string | null,
  });
  const [connected, setConnected] = useState(false);

  // socket ref to persist between renders
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // import dynamically so server-side build doesn't break
    let mounted = true;
    (async () => {
      const { io } = await import("socket.io-client");
      if (!mounted) return;
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        // join the device room so server will emit to this client (if deviceId set)
        if (deviceId) socket.emit("join-device", deviceId);
      });
      socket.on("disconnect", () => setConnected(false));

      // also join when deviceId changes and socket already connected
      // (note: this effect does not depend on deviceId; we handle join in a separate useEffect)

      // Listen for device-data (server emits 'device-data' for a device room)
      socket.on("device-data", (payload: any) => {
        if (!payload) return;
        // Map incoming payload to our UI fields. prefer payload.soil for moisture percentage
        const soilVal =
          typeof payload.soil === "number"
            ? payload.soil
            : payload.soilMoisture || null;
        const temp =
          typeof payload.temperature === "number" ? payload.temperature : null;
        const hum =
          typeof payload.humidity === "number" ? payload.humidity : null;
        const ph = typeof payload.ph === "number" ? payload.ph : null;
        const npk = typeof payload.npk === "number" ? payload.npk : null;
        const receivedAt = payload.receivedAt
          ? new Date(payload.receivedAt).toLocaleTimeString()
          : new Date().toLocaleTimeString();

        setLatest({
          temperature: temp,
          humidity: hum,
          soil: soilVal,
          ph,
          npk,
          receivedAt,
        });

        // Update moisture chart: add new point, keep last 20
        if (typeof soilVal === "number") {
          const timeLabel = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setMoistureData((prev) => {
            const next = [
              ...prev,
              { time: timeLabel, moisture: Math.round(soilVal) },
            ];
            return next.slice(-20);
          });
        }

        // Update temperature chart: add new point, keep last 20
        if (typeof temp === "number") {
          const timeLabelT = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setTemperatureData((prev) => {
            const next = [
              ...prev,
              { time: timeLabelT, temperature: Number(temp.toFixed(1)) },
            ];
            return next.slice(-20);
          });
        }
      });

      // optional: global event 'device-data-all' if you used it
      socket.on("device-data-all", (d: any) => {
        // no-op or used for global notifications
        // console.log("global event", d)
      });
    })();

    return () => {
      mounted = false;
      const s = socketRef.current;
      if (s) {
        try {
          // leave the device room on disconnect
          if (deviceId) s.emit("leave-device", deviceId);
        } catch (e) {}
        s.disconnect();
      }
    };
  }, [
    SOCKET_URL /* removed deviceId from deps on purpose to avoid reconnect loops */,
  ]);

  // when deviceId is set after socket created, emit join
  useEffect(() => {
    const s = socketRef.current;
    if (s && s.connected && deviceId) {
      s.emit("join-device", deviceId);
    }
    return () => {};
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                stroke="hsl(var(--color-primary))"
                strokeWidth={2}
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
