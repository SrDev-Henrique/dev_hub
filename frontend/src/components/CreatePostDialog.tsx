import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/usePosts";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const createPost = useCreatePost();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    createPost.mutate(text, {
      onSuccess: () => {
        setText("");
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Novo post</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar post</DialogTitle>
            <DialogDescription>No que você está pensando?</DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva algo..."
            rows={4}
            autoFocus
            className="my-4"
          />
          <DialogFooter>
            <Button type="submit" disabled={createPost.isPending || !text.trim()}>
              Publicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
