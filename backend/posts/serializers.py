from accounts.serializers import UserPublicSerializer
from rest_framework import serializers

from .models import Comment, Post


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ["id", "author", "text", "created_at", "updated_at", "like_count", "comment_count", "liked_by_me"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def get_liked_by_me(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        liked_ids = self.context.get("liked_post_ids")
        if liked_ids is not None:
            return obj.id in liked_ids
        return obj.likes.filter(user=request.user).exists()


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "post", "text", "created_at"]
        read_only_fields = ["id", "author", "post", "created_at"]
