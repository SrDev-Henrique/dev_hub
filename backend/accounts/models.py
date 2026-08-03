from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    name = models.CharField(max_length=150, blank=True, default="")
    profile_photo_url = models.URLField(blank=True, default="")

    def __str__(self):
        return self.username
