from django.urls import path

from .views import FollowersListView, FollowingListView, FollowToggleView

urlpatterns = [
    path("users/<int:user_id>/follow/", FollowToggleView.as_view(), name="follow-toggle"),
    path("users/<int:user_id>/followers/", FollowersListView.as_view(), name="followers-list"),
    path("users/<int:user_id>/following/", FollowingListView.as_view(), name="following-list"),
]
