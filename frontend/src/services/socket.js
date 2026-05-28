import { io } from 'socket.io-client';

// Use same API base URL resolution as api.js
const SOCKET_URL = import.meta.env.DEV
    ? 'http://localhost:5000'
    : (import.meta.env.VITE_API_URL || window.location.origin);

// Singleton socket instance
const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
});

export default socket;
