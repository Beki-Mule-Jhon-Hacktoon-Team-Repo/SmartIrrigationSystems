/* Simple singleton realtime manager to persist socket + state across page navigations.
   - init(options): initializes socket once (no-op on server)
   - subscribe(cb): subscribe to state updates, returns unsubscribe()
   - setDeviceId(id): save deviceId and emit join-device
   - getState(): current snapshot
*/
import type { Socket } from "socket.io-client";

type State = {
  connected: boolean;
  latest: any | null;
  moistureData: Array<any>;
  temperatureData: Array<any>;
};

let socket: Socket | null = null;
let initialized = false;
let subscribers: Array<(s: State) => void> = [];
let deviceIdStored: string | null = null;

const INITIAL_MOISTURE = [
  { time: "12:00", moisture: 45 },
  { time: "1:00", moisture: 48 },
  { time: "2:00", moisture: 52 },
  { time: "3:00", moisture: 58 },
  { time: "4:00", moisture: 55 },
  { time: "5:00", moisture: 50 },
];

const INITIAL_TEMPERATURE = [
  { time: "12:00", temperature: 22 },
  { time: "13:00", temperature: 23 },
  { time: "14:00", temperature: 24 },
  { time: "15:00", temperature: 23 },
  { time: "16:00", temperature: 22 },
];

let state: State = {
  connected: false,
  latest: null,
  moistureData: [...INITIAL_MOISTURE],
  temperatureData: [...INITIAL_TEMPERATURE],
};

function notify() {
  const snap = { ...state };
  subscribers.forEach((s) => {
    try {
      s(snap);
    } catch (e) {
      // ignore subscriber errors
    }
  });
}

export async function init(options?: { socketUrl?: string }) {
  if (typeof window === "undefined") return; // no-op on server
  if (initialized) return;
  initialized = true;

  const socketUrl =
    options?.socketUrl ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    window.location.origin;

  try {
    const { io } = await import("socket.io-client");
    socket = io(socketUrl, { transports: ["websocket"], autoConnect: true });

    socket.on("connect", () => {
      state.connected = true;
      // auto-join stored device if present
      try {
        const d = localStorage.getItem("deviceId");
        if (d) {
          deviceIdStored = d;
          socket?.emit("join-device", d);
        }
      } catch {}
      notify();
    });

    socket.on("disconnect", () => {
      state.connected = false;
      notify();
    });

    socket.on("device-data", (payload: any) => {
      if (!payload) return;
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
      // Extract pump value (accepts 1/0, "1"/"0", boolean)
      const pump = payload.pump !== undefined 
        ? (payload.pump === 1 || payload.pump === "1" || payload.pump === true ? 1 : 0)
        : (payload.pumpStatus !== undefined
          ? (payload.pumpStatus === 1 || payload.pumpStatus === "1" || payload.pumpStatus === true ? 1 : 0)
          : null);
      const receivedAt = payload.receivedAt
        ? new Date(payload.receivedAt).toLocaleTimeString()
        : new Date().toLocaleTimeString();

      state.latest = {
        temperature: temp,
        humidity: hum,
        soil: soilVal,
        ph,
        npk,
        pump,
        receivedAt,
      };

      if (typeof soilVal === "number") {
        const timeLabel = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        state.moistureData = [
          ...state.moistureData,
          { time: timeLabel, moisture: Math.round(soilVal) },
        ].slice(-40);
      }

      if (typeof temp === "number") {
        const timeLabelT = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        state.temperatureData = [
          ...state.temperatureData,
          { time: timeLabelT, temperature: Number(temp.toFixed(1)) },
        ].slice(-40);
      }

      notify();
    });

    socket.on("device-data-all", (payload: any) => {
      if (!payload) return;
      const rec = payload.data || payload;
      const soilVal =
        typeof rec.soil === "number" ? rec.soil : rec.soilMoisture ?? null;
      const temp = typeof rec.temperature === "number" ? rec.temperature : null;
      const hum = typeof rec.humidity === "number" ? rec.humidity : null;
      const ph = typeof rec.ph === "number" ? rec.ph : null;
      const npk = typeof rec.npk === "number" ? rec.npk : null;
      // Extract pump value (accepts 1/0, "1"/"0", boolean)
      const pump = rec.pump !== undefined 
        ? (rec.pump === 1 || rec.pump === "1" || rec.pump === true ? 1 : 0)
        : (rec.pumpStatus !== undefined
          ? (rec.pumpStatus === 1 || rec.pumpStatus === "1" || rec.pumpStatus === true ? 1 : 0)
          : null);
      const receivedAt = rec.receivedAt
        ? new Date(rec.receivedAt).toLocaleTimeString()
        : new Date().toLocaleTimeString();

      state.latest = {
        temperature: temp,
        humidity: hum,
        soil: soilVal,
        ph,
        npk,
        pump,
        receivedAt,
      };

      if (typeof soilVal === "number") {
        const timeLabel = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        state.moistureData = [
          ...state.moistureData,
          { time: timeLabel, moisture: Math.round(soilVal) },
        ].slice(-40);
      }
      if (typeof temp === "number") {
        const timeLabelT = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        state.temperatureData = [
          ...state.temperatureData,
          { time: timeLabelT, temperature: Number(temp.toFixed(1)) },
        ].slice(-40);
      }

      notify();
    });

    // preserve connection across navigation: do not auto-disconnect on unsubscribe
  } catch (err) {
    console.error("Realtime init failed", err);
  }
}

export function subscribe(cb: (s: State) => void) {
  subscribers.push(cb);
  // send initial snapshot
  try {
    cb({ ...state });
  } catch {}
  return () => {
    subscribers = subscribers.filter((c) => c !== cb);
  };
}

export function setDeviceId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem("deviceId", id);
      deviceIdStored = id;
      if (socket && socket.connected) socket.emit("join-device", id);
    } else {
      localStorage.removeItem("deviceId");
      if (deviceIdStored && socket && socket.connected)
        socket.emit("leave-device", deviceIdStored);
      deviceIdStored = null;
    }
  } catch (e) {}
}

export function getState() {
  return { ...state };
}

// optional: manual disconnect (not used by pages)
export function disconnect() {
  try {
    socket?.disconnect();
    socket = null;
    initialized = false;
  } catch {}
}
