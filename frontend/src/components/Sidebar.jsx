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
