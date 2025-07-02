import io from "socket.io-client";

const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:8000", {
    autoConnect: false,
    auth: {
        withCredentials: true
    },
    transports: ["websocket", "polling"],
});

export default socket;