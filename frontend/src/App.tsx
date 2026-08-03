import { Navigate, Route, Routes } from "react-router-dom";

import { NavBar } from "@/components/NavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { FeedPage } from "@/pages/FeedPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SearchPage } from "@/pages/SearchPage";
import { SettingsPage } from "@/pages/SettingsPage";

function AppLayout() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppLayout />} />
      </Route>
    </Routes>
  );
}

export default App;
