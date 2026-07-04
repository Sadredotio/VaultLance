import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

/**
 * Returns a singleton, authenticated socket connection.
 * Creates the connection on first call; reuses it on subsequent calls.
 */
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

/**
 * Cleanly disconnects and clears the socket singleton (call on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;