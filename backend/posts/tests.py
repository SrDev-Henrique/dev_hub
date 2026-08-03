from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from social.models import Follow

from .models import Comment, Like, Post

User = get_user_model()


class FeedTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="S3nhaForte!23")
        self.bob = User.objects.create_user(username="bob", password="S3nhaForte!23")
        self.carol = User.objects.create_user(username="carol", password="S3nhaForte!23")
        Follow.objects.create(follower=self.alice, following=self.bob)
        self.bob_post = Post.objects.create(author=self.bob, text="oi de bob")
        self.carol_post = Post.objects.create(author=self.carol, text="oi de carol")
        self.client.force_authenticate(self.alice)

    def test_feed_only_shows_followed_users_posts(self):
        response = self.client.get(reverse("feed"))
        ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.bob_post.id, ids)
        self.assertNotIn(self.carol_post.id, ids)

    def test_feed_is_paginated(self):
        for i in range(15):
            Post.objects.create(author=self.bob, text=f"post {i}")
        response = self.client.get(reverse("feed"))
        self.assertEqual(len(response.data["results"]), 10)
        self.assertIsNotNone(response.data["next"])


class UserPostsTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="S3nhaForte!23")
        self.bob = User.objects.create_user(username="bob", password="S3nhaForte!23")
        self.bob_post = Post.objects.create(author=self.bob, text="do bob")
        self.alice_post = Post.objects.create(author=self.alice, text="da alice")
        self.client.force_authenticate(self.alice)

    def test_user_posts_only_shows_that_users_posts(self):
        response = self.client.get(reverse("user-posts", args=[self.bob.id]))
        ids = [p["id"] for p in response.data["results"]]
        self.assertEqual(ids, [self.bob_post.id])
        self.assertNotIn(self.alice_post.id, ids)


class PostCrudTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="S3nhaForte!23")
        self.bob = User.objects.create_user(username="bob", password="S3nhaForte!23")
        self.client.force_authenticate(self.alice)

    def test_create_post(self):
        response = self.client.post(reverse("post-create"), {"text": "meu primeiro post"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.get().author, self.alice)

    def test_owner_can_edit_own_post(self):
        post = Post.objects.create(author=self.alice, text="original")
        response = self.client.patch(reverse("post-detail", args=[post.id]), {"text": "editado"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        post.refresh_from_db()
        self.assertEqual(post.text, "editado")

    def test_non_owner_cannot_edit_post(self):
        post = Post.objects.create(author=self.bob, text="do bob")
        response = self.client.patch(reverse("post-detail", args=[post.id]), {"text": "hackeado"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        post.refresh_from_db()
        self.assertEqual(post.text, "do bob")

    def test_owner_can_delete_own_post(self):
        post = Post.objects.create(author=self.alice, text="para apagar")
        response = self.client.delete(reverse("post-detail", args=[post.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_non_owner_cannot_delete_post(self):
        post = Post.objects.create(author=self.bob, text="do bob")
        response = self.client.delete(reverse("post-detail", args=[post.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Post.objects.filter(id=post.id).exists())


class LikeTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="S3nhaForte!23")
        self.bob = User.objects.create_user(username="bob", password="S3nhaForte!23")
        self.post = Post.objects.create(author=self.bob, text="curtam")
        self.client.force_authenticate(self.alice)

    def test_like_toggle_creates_and_removes(self):
        response = self.client.post(reverse("post-like-toggle", args=[self.post.id]))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Like.objects.filter(user=self.alice, post=self.post).exists())

        response = self.client.post(reverse("post-like-toggle", args=[self.post.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Like.objects.filter(user=self.alice, post=self.post).exists())

    def test_post_serializer_reports_like_count_and_liked_by_me(self):
        Like.objects.create(user=self.alice, post=self.post)
        response = self.client.get(reverse("post-detail", args=[self.post.id]))
        self.assertEqual(response.data["like_count"], 1)
        self.assertTrue(response.data["liked_by_me"])


class CommentTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="S3nhaForte!23")
        self.bob = User.objects.create_user(username="bob", password="S3nhaForte!23")
        self.post = Post.objects.create(author=self.bob, text="comentem")
        self.client.force_authenticate(self.alice)

    def test_create_comment(self):
        response = self.client.post(reverse("comment-list-create", args=[self.post.id]), {"text": "ótimo post"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        comment = Comment.objects.get()
        self.assertEqual(comment.author, self.alice)
        self.assertEqual(comment.post, self.post)

    def test_owner_can_edit_own_comment(self):
        comment = Comment.objects.create(author=self.alice, post=self.post, text="original")
        response = self.client.patch(reverse("comment-detail", args=[comment.id]), {"text": "editado"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comment.refresh_from_db()
        self.assertEqual(comment.text, "editado")

    def test_non_owner_cannot_delete_comment(self):
        comment = Comment.objects.create(author=self.bob, post=self.post, text="do bob")
        response = self.client.delete(reverse("comment-detail", args=[comment.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Comment.objects.filter(id=comment.id).exists())
