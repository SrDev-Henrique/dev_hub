import { Link, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold">
          Dev Hub
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Feed</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">Buscar</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/profile/${user.username}`}>Perfil</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">Configurações</Link>
          </Button>
          <Link to={`/profile/${user.username}`}>
            <Avatar className="size-8">
              <AvatarImage src={user.profile_photo_url} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
