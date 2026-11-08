import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any page with this to make it login-only
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking the saved token with the server: don't redirect yet
  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  if (!user) {
    // Send them to login, remembering where they wanted to go
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return children;
}