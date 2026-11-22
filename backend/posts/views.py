from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Post, Like, Comment
from .serializers import PostSerializer, CommentSerializer


class PostListCreateView(generics.ListCreateAPIView):

    queryset = Post.objects.select_related("author").all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class LikeToggleView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        like, created = Like.objects.get_or_create(
            user=request.user,
            post=post
        )

        if not created:
            like.delete()

            return Response({
                "message": "Post unliked",
                "liked": False,
                "likes_count": post.likes.count()
            })

        return Response({
            "message": "Post liked",
            "liked": True,
            "likes_count": post.likes.count()
        })


class CommentListCreateView(generics.ListCreateAPIView):

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(
            post_id=self.kwargs["post_id"]
        ).select_related("user")

    def perform_create(self, serializer):
        post = generics.get_object_or_404(
            Post,
            id=self.kwargs["post_id"]
        )

        serializer.save(
            user=self.request.user,
            post=post
        )


class CommentDeleteView(generics.DestroyAPIView):

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(
            user=self.request.user
        )