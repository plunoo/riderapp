import { Outlet } from "react-router-dom";
import { Sidebar } from "../../components/Layout/Sidebar";

export default function AdminLayout() {
  const links = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/riders", label: "Riders" },
    { to: "/admin/attendance", label: "Attendance" },
    { to: "/admin/management", label: "Management" },
    { to: "/admin/rider-access", label: "Rider Access" },
  ];

  return (
    <div className="admin-layout">
      <Sidebar links={links} />
      <main className="admin-main">
        <div className="admin-shell">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
