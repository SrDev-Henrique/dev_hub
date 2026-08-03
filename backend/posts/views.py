from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from social.models import Follow

from .models import Comment, Like, Post
from .permissions import IsOwnerOrReadOnly
from .serializers import CommentSerializer, PostSerializer

User = get_user_model()


def annotate_counts(queryset):
    return queryset.annotate(
        like_count=Count("likes", distinct=True), comment_count=Count("comments", distinct=True)
    ).order_by("-created_at")


class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        following_ids = Follow.objects.filter(follower=self.request.user).values_list("following_id", flat=True)
        return annotate_counts(
            Post.objects.filter(Q(author_id__in=following_ids) | Q(author=self.request.user))
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["liked_post_ids"] = set(
            Like.objects.filter(user=self.request.user).values_list("post_id", flat=True)
        )
        return context


class PostCreateView(generics.CreateAPIView):
    serializer_class = PostSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class UserPostsView(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return annotate_counts(Post.objects.filter(author_id=self.kwargs["user_id"]))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["liked_post_ids"] = set(
            Like.objects.filter(user=self.request.user).values_list("post_id", flat=True)
        )
        return context


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return annotate_counts(Post.objects.all())


class LikeToggleView(APIView):
    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({"liked": False}, status=status.HTTP_200_OK)
        return Response({"liked": True}, status=status.HTTP_201_CREATED)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs["post_id"])

    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs["post_id"])
        serializer.save(author=self.request.user, post=post)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsOwnerOrReadOnly]
    queryset = Comment.objects.all()
