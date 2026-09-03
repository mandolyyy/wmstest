import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Inbound from './pages/Inbound.jsx';
import Storage from './pages/Storage.jsx';
import Outbound from './pages/Outbound.jsx';
import Reporting from './pages/Reporting.jsx';

export const UserContext = createContext({ userId: '', setUserId: () => {} });
export const useUser = () => useContext(UserContext);

function UserBadge() {
  const { userId, setUserId } = useUser();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Operator</span>
      <input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="user ID"
        style={{ width: 130 }}
      />
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('wms_user_id') || '');

  useEffect(() => {
    localStorage.setItem('wms_user_id', userId);
  }, [userId]);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <UserBadge />
          </div>
          <Routes>
            <Route path="/" element={<Navigate to="/inbound" replace />} />
            <Route path="/inbound" element={<Inbound />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/outbound" element={<Outbound />} />
            <Route path="/reporting" element={<Reporting />} />
          </Routes>
        </main>
      </div>
    </UserContext.Provider>
  );
}
