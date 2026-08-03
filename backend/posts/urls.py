from django.urls import path

from .views import CommentDetailView, CommentListCreateView, FeedView, LikeToggleView, PostCreateView, PostDetailView

urlpatterns = [
    path("posts/feed/", FeedView.as_view(), name="feed"),
    path("posts/", PostCreateView.as_view(), name="post-create"),
    path("posts/<int:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("posts/<int:post_id>/like/", LikeToggleView.as_view(), name="post-like-toggle"),
    path("posts/<int:post_id>/comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="comment-detail"),
]
