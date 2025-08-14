from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import secrets
import string

from .models import User, Page, Permission, Comment, CommentHistory
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    PageSerializer, PermissionSerializer, PermissionCreateSerializer,
    CommentSerializer, CommentCreateSerializer, CommentHistorySerializer,
    LoginSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer,
    PasswordChangeSerializer, UserRoleTableSerializer
)

User = get_user_model()


class IsSuperAdmin(permissions.BasePermission):
    """Custom permission to only allow super admins"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin()


class HasPagePermission(permissions.BasePermission):
    """Custom permission to check page-specific permissions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Super admin has access to everything
        if request.user.is_super_admin():
            return True
        
        # Get page name from URL or request
        page_name = view.kwargs.get('page_name') or request.data.get('page')
        if not page_name:
            return False
        
        # Check if user has required permission for the page
        required_permission = getattr(view, 'required_permission', 'view')
        return request.user.permissions.filter(
            page__name=page_name,
            permission_type=required_permission
        ).exists()


class AuthViewSet(viewsets.ViewSet):
    """Authentication views"""
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """User login endpoint"""
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last activity
            user.update_last_activity()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """User logout endpoint"""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({'message': 'Successfully logged out'})
        except Exception:
            return Response({'message': 'Successfully logged out'})
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset(self, request):
        """Password reset request endpoint"""
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate OTP (in production, send via email)
            otp = ''.join(secrets.choice(string.digits) for _ in range(6))
            
            # Store OTP in session (in production, use Redis or database)
            request.session[f'password_reset_otp_{email}'] = otp
            request.session[f'password_reset_time_{email}'] = timezone.now().timestamp()
            
            # For development, return OTP in response
            return Response({
                'message': 'Password reset OTP sent to your email',
                'otp': otp  # Remove this in production
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_confirm(self, request):
        """Password reset confirmation endpoint"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            new_password = serializer.validated_data['new_password']
            
            # Verify OTP
            stored_otp = request.session.get(f'password_reset_otp_{email}')
            stored_time = request.session.get(f'password_reset_time_{email}')
            
            if not stored_otp or not stored_time:
                return Response({'error': 'Invalid or expired OTP'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Check if OTP is expired (15 minutes)
            if timezone.now().timestamp() - stored_time > 900:
                return Response({'error': 'OTP expired'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            if otp != stored_otp:
                return Response({'error': 'Invalid OTP'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Update password
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            # Clear session data
            del request.session[f'password_reset_otp_{email}']
            del request.session[f'password_reset_time_{email}']
            
            return Response({'message': 'Password successfully reset'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def password_change(self, request):
        """Password change endpoint"""
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            if not user.check_password(old_password):
                return Response({'error': 'Current password is incorrect'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.save()
            
            return Response({'message': 'Password successfully changed'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """User management views"""
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy', 'list']:
            permission_classes = [IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create new user with auto-generated password"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Generate strong password if not provided
            if 'password' not in serializer.validated_data:
                password = User().generate_strong_password()
                serializer.validated_data['password'] = password
            
            user = serializer.save()
            
            response_data = UserSerializer(user).data
            response_data['generated_password'] = serializer.validated_data.get('password')
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def role_table(self, request):
        """Get user role table for admin dashboard"""
        if not request.user.is_super_admin():
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserRoleTableSerializer(data={})
        return Response(serializer.to_representation({}))


class PageViewSet(viewsets.ReadOnlyModelViewSet):
    """Page management views"""
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for a specific page"""
        page = self.get_object()
        
        # Check if user has view permission for this page
        if not request.user.is_super_admin():
            if not request.user.permissions.filter(page=page, permission_type='view').exists():
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        comments = Comment.objects.filter(page=page, is_deleted=False)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


class PermissionViewSet(viewsets.ModelViewSet):
    """Permission management views"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PermissionCreateSerializer
        return PermissionSerializer
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update user permissions"""
        user_id = request.data.get('user_id')
        permissions_data = request.data.get('permissions', [])
        
        if not user_id:
            return Response({'error': 'user_id is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        with transaction.atomic():
            # Delete existing permissions for this user
            Permission.objects.filter(user=user).delete()
            
            # Create new permissions
            for perm_data in permissions_data:
                page_name = perm_data.get('page')
                permission_types = perm_data.get('permissions', [])
                
                try:
                    page = Page.objects.get(name=page_name)
                    for perm_type in permission_types:
                        Permission.objects.create(
                            user=user,
                            page=page,
                            permission_type=perm_type,
                            granted_by=request.user
                        )
                except Page.DoesNotExist:
                    continue
        
        return Response({'message': 'Permissions updated successfully'})


class CommentViewSet(viewsets.ModelViewSet):
    """Comment management views"""
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer
    
    def perform_create(self, serializer):
        """Create comment and track history"""
        comment = serializer.save()
        
        # Create history entry
        CommentHistory.objects.create(
            comment=comment,
            content=comment.content,
            modified_by=self.request.user,
            action='created'
        )
    
    def perform_update(self, serializer):
        """Update comment and track history"""
        old_content = self.get_object().content
        comment = serializer.save()
        
        # Create history entry if content changed
        if old_content != comment.content:
            CommentHistory.objects.create(
                comment=comment,
                content=comment.content,
                modified_by=self.request.user,
                action='updated'
            )
    
    def perform_destroy(self, instance):
        """Soft delete comment and track history"""
        instance.soft_delete(self.request.user)
        
        # Create history entry
        CommentHistory.objects.create(
            comment=instance,
            content=instance.content,
            modified_by=self.request.user,
            action='deleted'
        )
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get comment modification history"""
        comment = self.get_object()
        
        # Only super admin can view history
        if not request.user.is_super_admin():
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        history = comment.history.all()
        serializer = CommentHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        """Filter comments based on user permissions"""
        queryset = super().get_queryset()
        
        # Super admin can see all comments
        if self.request.user.is_super_admin():
            return queryset
        
        # Regular users can only see comments from pages they have view access to
        user_pages = self.request.user.permissions.filter(
            permission_type='view'
        ).values_list('page_id', flat=True)
        
        return queryset.filter(page_id__in=user_pages)
