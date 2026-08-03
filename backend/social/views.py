from accounts.serializers import UserPublicSerializer
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow

User = get_user_model()


class FollowToggleView(APIView):
    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        if target.id == request.user.id:
            return Response({"detail": "Você não pode seguir a si mesmo."}, status=status.HTTP_400_BAD_REQUEST)
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response(status=status.HTTP_201_CREATED)

    def delete(self, request, user_id):
        Follow.objects.filter(follower=request.user, following_id=user_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowersListView(generics.ListAPIView):
    """Quem segue o usuário `user_id`."""

    serializer_class = UserPublicSerializer

    def get_queryset(self):
        user_id = self.kwargs["user_id"]
        return User.objects.filter(following_links__following_id=user_id).order_by("username")


class FollowingListView(generics.ListAPIView):
    """Quem o usuário `user_id` segue."""

    serializer_class = UserPublicSerializer

    def get_queryset(self):
        user_id = self.kwargs["user_id"]
        return User.objects.filter(follower_links__follower_id=user_id).order_by("username")
