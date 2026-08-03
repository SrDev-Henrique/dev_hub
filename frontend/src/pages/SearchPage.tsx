import { useState } from "react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useUserSearch } from "@/hooks/useSocial";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useUserSearch(query);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <Input
        placeholder="Buscar por nome ou usuário..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {isLoading && <p className="text-muted-foreground">Buscando...</p>}

      {query.trim() && !isLoading && data?.length === 0 && (
        <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
      )}

      <div className="flex flex-col gap-2">
        {data?.map((user) => (
          <Link
            key={user.id}
            to={`/profile/${user.username}`}
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent"
          >
            <Avatar>
              <AvatarImage src={user.profile_photo_url} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium">{user.name || user.username}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
