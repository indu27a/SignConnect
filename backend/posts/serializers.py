from rest_framework import serializers
from .models import Post, Comment


class CommentSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = Comment
        fields = [
            "id",
            "user",
            "username",
            "post",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "post",
            "created_at",
            "updated_at",
        ]


class PostSerializer(serializers.ModelSerializer):

    author_username = serializers.CharField(
        source="author.username",
        read_only=True
    )

    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "author_username",
            "content",
            "image",
            "created_at",
            "updated_at",
            "likes_count",
            "is_liked",
            "comments_count",
        ]

        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
            "likes_count",
            "is_liked",
            "comments_count",
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()

        return False

    def get_comments_count(self, obj):
        return obj.comments.count()