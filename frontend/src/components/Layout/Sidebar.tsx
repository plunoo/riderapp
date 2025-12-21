import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function Sidebar({ links }: { links: { to: string; label: string }[] }) {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">Admin</div>
        <button className="sidebar-logout" onClick={logout}>Logout</button>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
