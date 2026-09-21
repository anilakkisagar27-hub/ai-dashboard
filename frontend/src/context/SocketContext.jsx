import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const Ctx = createContext(null);

const PORTS = [5000, 5001, 5002, 3001];

const detectSocketURL = async () => {
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return `http://localhost:${port}`;
    } catch { /* try next */ }
  }
  return 'http://localhost:5000'; // fallback
};

export const SocketProvider = ({ children }) => {
  const [connected,  setConnected]  = useState(false);
  const [vitalsMap,  setVitalsMap]  = useState({});
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    let socket;

    detectSocketURL().then((url) => {
      console.log('[SOCKET] Connecting to', url);
      socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 20,
        reconnectionDelay: 2000,
      });

      socket.on('connect',       () => { setConnected(true);  console.log('[SOCKET] Connected'); });
      socket.on('disconnect',    () => { setConnected(false); });
      socket.on('connect_error', (e) => console.warn('[SOCKET] Error:', e.message));

      socket.on('vitals_update', (data) => {
        setVitalsMap(prev => ({
          ...prev,
          [data.patientId]: { vitals: data.vitals, aiStatus: data.aiStatus },
        }));
      });

      socket.on('emergency_alert', (alert) => {
        setLiveAlerts(prev => [{ ...alert, _uid: Date.now() }, ...prev.slice(0, 9)]);
      });
    });

    return () => { if (socket) socket.disconnect(); };
  }, []);

  const dismissAlert = (uid) => setLiveAlerts(p => p.filter(a => a._uid !== uid));

  return (
    <Ctx.Provider value={{ connected, vitalsMap, liveAlerts, dismissAlert }}>
      {children}
    </Ctx.Provider>
  );
};

export const useSocket = () => useContext(Ctx);
