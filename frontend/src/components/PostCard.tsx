import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { CommentList } from "@/components/CommentList";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useDeletePost, useToggleLike, useUpdatePost } from "@/hooks/usePosts";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const toggleLike = useToggleLike();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [showComments, setShowComments] = useState(false);

  const isOwner = user?.id === post.author.id;

  function handleSaveEdit() {
    if (!editText.trim()) return;
    setIsEditing(false);
    updatePost.mutate({ id: post.id, text: editText });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-2">
          <Avatar className="size-9">
            <AvatarImage src={post.author.profile_photo_url} alt={post.author.username} />
            <AvatarFallback>{post.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium">{post.author.name || post.author.username}</p>
            <p className="text-xs text-muted-foreground">
              @{post.author.username} · {new Date(post.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        </Link>
        {isOwner && !isEditing && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)} aria-label="Editar post">
              <Pencil className="size-4" />
            </Button>
            <DeleteConfirmButton
              title="Excluir post"
              description="Essa ação não pode ser desfeita. O post será excluído permanentemente."
              onConfirm={() => deletePost.mutate(post.id)}
            >
              <Button variant="ghost" size="icon-sm" aria-label="Excluir post">
                <Trash2 className="size-4" />
              </Button>
            </DeleteConfirmButton>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-left">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{post.text}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => toggleLike.mutate(post.id)}
            disabled={toggleLike.isPending}
          >
            <Heart className={`size-4 ${post.liked_by_me ? "fill-destructive text-destructive" : ""}`} />
            {post.like_count}
          </button>
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageCircle className="size-4" />
            {post.comment_count}
          </button>
        </div>

        {showComments && <CommentList postId={post.id} />}
      </CardContent>
    </Card>
  );
}
