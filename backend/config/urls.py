from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),

    path("api/prediction/", include("prediction.urls")),

    path("api/posts/", include("posts.urls")),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),
]