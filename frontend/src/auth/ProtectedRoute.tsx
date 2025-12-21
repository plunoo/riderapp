import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Role = "admin" | "prime_admin" | "sub_admin" | "rider";

export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: JSX.Element }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role as Role)) {
    return <Navigate to={user.role === "rider" ? "/rider" : "/admin"} replace />;
  }

  return children;
}
