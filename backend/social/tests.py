from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Follow

User = get_user_model()


class FollowTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="S3nhaForte!23")
        self.bob = User.objects.create_user(username="bob", password="S3nhaForte!23")
        self.carol = User.objects.create_user(username="carol", password="S3nhaForte!23")
        self.client.force_authenticate(self.alice)

    def test_follow_creates_relationship(self):
        response = self.client.post(reverse("follow-toggle", args=[self.bob.id]))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Follow.objects.filter(follower=self.alice, following=self.bob).exists())

    def test_follow_is_idempotent(self):
        self.client.post(reverse("follow-toggle", args=[self.bob.id]))
        self.client.post(reverse("follow-toggle", args=[self.bob.id]))
        self.assertEqual(Follow.objects.filter(follower=self.alice, following=self.bob).count(), 1)

    def test_cannot_follow_self(self):
        response = self.client.post(reverse("follow-toggle", args=[self.alice.id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unfollow_removes_relationship(self):
        self.client.post(reverse("follow-toggle", args=[self.bob.id]))
        response = self.client.delete(reverse("follow-toggle", args=[self.bob.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Follow.objects.filter(follower=self.alice, following=self.bob).exists())

    def test_followers_list_shows_who_follows_target(self):
        Follow.objects.create(follower=self.alice, following=self.carol)
        Follow.objects.create(follower=self.bob, following=self.carol)
        response = self.client.get(reverse("followers-list", args=[self.carol.id]))
        usernames = {u["username"] for u in response.data["results"]}
        self.assertEqual(usernames, {"alice", "bob"})

    def test_following_list_shows_who_target_follows(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        Follow.objects.create(follower=self.alice, following=self.carol)
        response = self.client.get(reverse("following-list", args=[self.alice.id]))
        usernames = {u["username"] for u in response.data["results"]}
        self.assertEqual(usernames, {"bob", "carol"})
