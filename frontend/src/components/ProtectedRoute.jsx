import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Pages accessible even when the trial/subscription has expired
const ALLOWED_WHEN_LOCKED = ["/", "/billing", "/admin/subscriptions"];

export default function ProtectedRoute({ children, permission }) {
  const { user, hasPermission, loading, isAccountLocked } = useAuth();
  const location = useLocation();

  // Wait until auth check finishes
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Trial/subscription expired — only allow billing + dashboard + subscriptions
  if (isAccountLocked && !ALLOWED_WHEN_LOCKED.includes(location.pathname)) {
    return <Navigate to="/billing" replace />;
  }

  // Permission check
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/403" />;
  }

  return children;
}
