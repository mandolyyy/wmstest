import { NavLink } from 'react-router-dom';

const links = [
  { to: '/inbound', label: 'Inbound', code: '01' },
  { to: '/storage', label: 'Storage setting', code: '02' },
  { to: '/outbound', label: 'Outbound', code: '03' },
  { to: '/reporting', label: 'Reporting', code: '04' },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="1" width="24" height="24" rx="2" stroke="#e8a33d" strokeWidth="1.4" />
            <path d="M1 9H25M9 9V25M17 9V25" stroke="#e8a33d" strokeWidth="1.4" />
          </svg>
          <div>
            <div className="brand-name">WMS TEST</div>
            
          </div>
        </div>
      </div>
      <ul className="nav-list">
        {links.map((l) => (
          <li className="nav-item" key={l.to}>
            <NavLink to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
              <span className="n-code">{l.code}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">localhost:4000/api</div>
    </nav>
  );
}
