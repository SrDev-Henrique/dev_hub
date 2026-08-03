import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold">
          Dev Hub
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Feed</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">Buscar</Link>
          </Button>
        </div>

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Menu do perfil" className="rounded-full">
              <Avatar className="size-8">
                <AvatarImage src={user.profile_photo_url} alt={user.username} />
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          {/* animation disabled: Radix's exit-animation Presence tracking gets stuck open
              (data-state flips to "closed" but the node never unmounts) in this app; forcing
              no animation makes Presence unmount synchronously instead of waiting on animationend. */}
          <PopoverContent align="end" className="w-44 p-1.5" style={{ animation: "none" }}>
            <Link
              to={`/profile/${user.username}`}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              Perfil
            </Link>
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              Configurações
            </Link>
            <Button variant="outline" size="sm" className="mt-1" onClick={handleLogout}>
              Sair
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
