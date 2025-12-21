import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Riders from "./pages/admin/Riders";
import Attendance from "./pages/admin/Attendance";
import Management from "./pages/admin/Management";
import RiderAccess from "./pages/admin/RiderAccess";
import RiderLayout from "./pages/rider/RiderLayout";
import RiderDashboard from "./pages/rider/Dashboard";
import CheckIn from "./pages/rider/CheckIn";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "prime_admin", "sub_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="riders" element={<Riders />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="management" element={<Management />} />
          <Route path="rider-access" element={<RiderAccess />} />
        </Route>

        <Route
          path="/rider"
          element={
            <ProtectedRoute roles={["rider"]}>
              <RiderLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RiderDashboard />} />
          <Route path="check-in" element={<CheckIn />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
