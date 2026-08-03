from django.conf import settings
from django.db import models


class Follow(models.Model):
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="following_links", on_delete=models.CASCADE)
    following = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="follower_links", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")
        constraints = [
            models.CheckConstraint(condition=~models.Q(follower=models.F("following")), name="cant_follow_self"),
        ]

    def __str__(self):
        return f"{self.follower} -> {self.following}"
