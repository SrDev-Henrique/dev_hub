import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
