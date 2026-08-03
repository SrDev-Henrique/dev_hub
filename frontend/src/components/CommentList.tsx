import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "@/hooks/usePosts";
import type { Comment } from "@/lib/types";

function CommentItem({ comment, postId }: { comment: Comment; postId: number }) {
  const { user } = useAuth();
  const updateComment = useUpdateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment.text);

  const isOwner = user?.id === comment.author.id;

  function handleSave() {
    if (!text.trim()) return;
    updateComment.mutate({ id: comment.id, text }, { onSuccess: () => setIsEditing(false) });
  }

  return (
    <div className="flex flex-col gap-1 border-t border-border py-2 text-left text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{comment.author.name || comment.author.username}</span>
        {isOwner && !isEditing && (
          <div className="flex gap-2 text-xs text-muted-foreground">
            <button type="button" className="hover:text-foreground" onClick={() => setIsEditing(true)}>
              editar
            </button>
            <button
              type="button"
              className="hover:text-destructive"
              onClick={() => confirm("Excluir comentário?") && deleteComment.mutate(comment.id)}
            >
              excluir
            </button>
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateComment.isPending}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p>{comment.text}</p>
      )}
    </div>
  );
}

export function CommentList({ postId }: { postId: number }) {
  const { data, isLoading } = useComments(postId, true);
  const createComment = useCreateComment(postId);
  const [newComment, setNewComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    createComment.mutate(newComment, { onSuccess: () => setNewComment("") });
  }

  return (
    <div className="flex flex-col">
      {isLoading && <p className="text-sm text-muted-foreground">Carregando comentários...</p>}
      {data?.results.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={1}
          className="min-h-9"
        />
        <Button type="submit" size="sm" disabled={createComment.isPending}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
