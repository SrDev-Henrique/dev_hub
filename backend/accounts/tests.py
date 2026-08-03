from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterLoginTests(APITestCase):
    def test_register_creates_user(self):
        response = self.client.post(reverse("register"), {
            "username": "alice",
            "email": "alice@example.com",
            "password": "S3nhaForte!23",
            "name": "Alice",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="alice").exists())
        self.assertNotIn("password", response.data)

    def test_register_rejects_weak_password(self):
        response = self.client.post(reverse("register"), {
            "username": "bob",
            "email": "bob@example.com",
            "password": "123",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens(self):
        User.objects.create_user(username="carol", password="S3nhaForte!23")
        response = self.client.post(reverse("login"), {"username": "carol", "password": "S3nhaForte!23"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_rejects_wrong_password(self):
        User.objects.create_user(username="carol", password="S3nhaForte!23")
        response = self.client.post(reverse("login"), {"username": "carol", "password": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="dave", password="S3nhaForte!23", name="Dave", email="d@e.com")
        self.client.force_authenticate(self.user)

    def test_get_me(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "dave")

    def test_patch_name_only_leaves_other_fields_untouched(self):
        response = self.client.patch(reverse("me"), {"name": "David"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "David")
        self.assertTrue(self.user.check_password("S3nhaForte!23"))

    def test_patch_empty_body_changes_nothing(self):
        response = self.client.patch(reverse("me"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "Dave")

    def test_patch_password_requires_current_password(self):
        response = self.client.patch(reverse("me"), {"new_password": "OutraSenhaForte!45"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_password_with_wrong_current_password_fails(self):
        response = self.client.patch(reverse("me"), {
            "current_password": "wrong",
            "new_password": "OutraSenhaForte!45",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("S3nhaForte!23"))

    def test_patch_password_success(self):
        response = self.client.patch(reverse("me"), {
            "current_password": "S3nhaForte!23",
            "new_password": "OutraSenhaForte!45",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OutraSenhaForte!45"))

    @patch("accounts.storage.upload_profile_photo")
    def test_patch_photo_uploads_and_saves_url(self, mock_upload):
        mock_upload.return_value = "https://supabase.example/bucket/photo.jpg"
        import base64

        from django.core.files.uploadedfile import SimpleUploadedFile

        one_pixel_png = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        )
        photo = SimpleUploadedFile("avatar.png", one_pixel_png, content_type="image/png")
        response = self.client.patch(reverse("me"), {"photo": photo}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile_photo_url, "https://supabase.example/bucket/photo.jpg")


class UserSearchTests(APITestCase):
    def setUp(self):
        self.me = User.objects.create_user(username="erin", password="S3nhaForte!23")
        User.objects.create_user(username="frank", password="S3nhaForte!23", name="Frank Sinatra")
        User.objects.create_user(username="grace", password="S3nhaForte!23")
        self.client.force_authenticate(self.me)

    def test_search_by_username(self):
        response = self.client.get(reverse("user-search"), {"q": "fra"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [u["username"] for u in response.data["results"]]
        self.assertIn("frank", usernames)

    def test_search_excludes_self(self):
        response = self.client.get(reverse("user-search"), {"q": "erin"})
        usernames = [u["username"] for u in response.data["results"]]
        self.assertNotIn("erin", usernames)

    def test_empty_query_returns_empty(self):
        response = self.client.get(reverse("user-search"), {"q": ""})
        self.assertEqual(response.data["results"], [])
