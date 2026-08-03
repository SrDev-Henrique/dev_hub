import { useState } from "react";

import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost, useFeed } from "@/hooks/usePosts";

const PAGE_SIZE = 10;

export function FeedPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFeed(page);
  const createPost = useCreatePost();
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    createPost.mutate(text, { onSuccess: () => setText("") });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="No que você está pensando?"
          rows={3}
        />
        <Button type="submit" disabled={createPost.isPending} className="self-end">
          Publicar
        </Button>
      </form>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && data?.results.length === 0 && (
        <p className="text-center text-muted-foreground">
          Seu feed está vazio. Siga outras pessoas para ver as postagens delas aqui.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {data?.results.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
