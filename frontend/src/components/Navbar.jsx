import React, { useState, useEffect } from 'react';
import { Activity, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'DR';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-icon"><Activity size={17} color="var(--cyan)" /></div>
        <div>
          <div className="nav-title">ICU·AI MONITOR</div>
          <div className="nav-sub">Neural Health Intelligence v3.0</div>
        </div>
      </div>

      <div className="nav-center">
        <div className="nav-status-pill">
          <div className={`dot ${connected ? 'dot-green' : 'dot-red'}`} />
          {connected ? 'AI HEALTHCARE ONLINE' : 'RECONNECTING...'}
        </div>
        <div className="nav-time">{timeStr}</div>
        <div className="nav-url">http://localhost:3000</div>
      </div>

      <div className="nav-right">
        <div style={{ textAlign: 'right' }}>
          <div className="nav-uname">{user?.name || 'User'}</div>
          <div className="nav-urole">{user?.role} · {user?.department}</div>
        </div>
        <div className="nav-avatar">{initials}</div>
        <button className="nav-logout" onClick={logout}>
          <LogOut size={12} /> EXIT
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
