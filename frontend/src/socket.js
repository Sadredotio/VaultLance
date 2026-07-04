import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

let socket = null;

export const getSocket = () => {
  if (socket && socket.connected) return socket;

  const userInfo = localStorage.getItem("userInfo");
  const token = userInfo ? JSON.parse(userInfo)?.token : null;

  if (!token) {
    console.warn("⚠️ No auth token found — socket connection skipped");
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 Socket connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("⚪ Socket disconnected:", reason);
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;