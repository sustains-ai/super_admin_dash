from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Page, Permission, Comment, CommentHistory


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 
                 'is_active', 'created_at', 'last_activity', 'permissions']
        read_only_fields = ['id', 'created_at', 'last_activity', 'permissions']
    
    def get_permissions(self, obj):
        """Get user permissions grouped by page"""
        permissions = obj.permissions.all().select_related('page')
        permission_data = {}
        
        for perm in permissions:
            page_name = perm.page.name
            if page_name not in permission_data:
                permission_data[page_name] = {
                    'page_name': perm.page.display_name,
                    'permissions': []
                }
            permission_data[page_name]['permissions'].append(perm.permission_type)
        
        return permission_data


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (super admin only)"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'role', 'password']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name']
    
    def validate_email(self, value):
        """Prevent email changes"""
        if self.instance and value != self.instance.email:
            raise serializers.ValidationError("Email cannot be changed.")
        return value


class PageSerializer(serializers.ModelSerializer):
    """Serializer for Page model"""
    
    class Meta:
        model = Page
        fields = ['id', 'name', 'display_name', 'description', 'created_at']


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission model"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    page_name = serializers.CharField(source='page.display_name', read_only=True)
    granted_by_email = serializers.CharField(source='granted_by.email', read_only=True)
    
    class Meta:
        model = Permission
        fields = ['id', 'user', 'page', 'permission_type', 'granted_by', 
                 'granted_at', 'user_email', 'page_name', 'granted_by_email']
        read_only_fields = ['granted_at', 'user_email', 'page_name', 'granted_by_email']


class PermissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating permissions"""
    
    class Meta:
        model = Permission
        fields = ['user', 'page', 'permission_type']
    
    def create(self, validated_data):
        validated_data['granted_by'] = self.context['request'].user
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment model"""
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    page_name = serializers.CharField(source='page.display_name', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'page', 'content', 'created_by', 'created_at', 'updated_at',
                 'is_deleted', 'created_by_email', 'page_name']
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'is_deleted',
                           'created_by_email', 'page_name']


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments"""
    
    class Meta:
        model = Comment
        fields = ['page', 'content']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CommentHistorySerializer(serializers.ModelSerializer):
    """Serializer for CommentHistory model"""
    modified_by_email = serializers.CharField(source='modified_by.email', read_only=True)
    
    class Meta:
        model = CommentHistory
        fields = ['id', 'comment', 'content', 'modified_by', 'modified_at', 
                 'action', 'modified_by_email']
        read_only_fields = ['modified_by', 'modified_at', 'modified_by_email']


# Authentication Serializers
class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
        else:
            raise serializers.ValidationError('Must include email and password.')
        
        attrs['user'] = user
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError('No active user found with this email address.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        
        # Validate password strength
        validate_password(attrs['new_password'])
        
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        
        # Validate password strength
        validate_password(attrs['new_password'])
        
        return attrs


class UserRoleTableSerializer(serializers.Serializer):
    """Serializer for user role table display"""
    users = UserSerializer(many=True, read_only=True)
    pages = PageSerializer(many=True, read_only=True)
    permissions = PermissionSerializer(many=True, read_only=True)
    
    def to_representation(self, instance):
        """Custom representation for user role table"""
        users = User.objects.filter(is_active=True).prefetch_related('permissions__page')
        pages = Page.objects.all()
        
        # Create user-role matrix
        user_role_data = []
        for user in users:
            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role,
                'page_permissions': {}
            }
            
            # Get user permissions for each page
            for page in pages:
                permissions = user.permissions.filter(page=page)
                user_data['page_permissions'][page.name] = [
                    perm.permission_type for perm in permissions
                ]
            
            user_role_data.append(user_data)
        
        return {
            'users': user_role_data,
            'pages': PageSerializer(pages, many=True).data
        }
