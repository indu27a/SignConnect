from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User Model
    """

    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("USER", "User"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="USER"
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True
    )

    date_of_birth = models.DateField(
        blank=True,
        null=True
    )

    preferred_language = models.CharField(
        max_length=30,
        default="English"
    )

    translation_count = models.PositiveIntegerField(
        default=0
    )

    is_verified = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.username