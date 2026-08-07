import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Role } from "../types";

interface RequireRoleProps {
  roles: Role[];
}

// Frontend route guard = UX convenience only. Server roleGuard middleware is the real boundary.
export function RequireRole({ roles }: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
