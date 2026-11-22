from django.urls import path
from .views import (
    PostListCreateView,
    LikeToggleView,
    CommentListCreateView,
    CommentDeleteView,
)

urlpatterns = [
    path(
        "",
        PostListCreateView.as_view(),
        name="post-list-create"
    ),

    path(
        "<int:post_id>/like/",
        LikeToggleView.as_view(),
        name="post-like-toggle"
    ),

    path(
        "<int:post_id>/comments/",
        CommentListCreateView.as_view(),
        name="comment-list-create"
    ),

    path(
        "comments/<int:pk>/delete/",
        CommentDeleteView.as_view(),
        name="comment-delete"
    ),
]