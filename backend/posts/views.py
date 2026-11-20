from rest_framework import generics, permissions
from .models import Post
from .serializers import PostSerializer


class PostListCreateView(generics.ListCreateAPIView):

    queryset = Post.objects.select_related("author").all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)