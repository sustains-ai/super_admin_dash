from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AuthViewSet, UserViewSet, PageViewSet, PermissionViewSet, CommentViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # JWT token refresh
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
