import { Outlet } from "react-router-dom";

export default function RiderLayout() {
  return (
    <div style={{ background: "#eef2f7", minHeight: "100vh", padding: 20 }}>
      <Outlet />
    </div>
  );
}
