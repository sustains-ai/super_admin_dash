from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import secrets
import string


class User(AbstractUser):
    """Custom User model with role-based access control"""
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('user', 'Regular User'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # Override username to use email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
    
    def is_super_admin(self):
        return self.role == 'super_admin'
    
    def update_last_activity(self):
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def generate_strong_password(self):
        """Generate a strong password for new users"""
        length = 12
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(characters) for _ in range(length))
        return password


class Page(models.Model):
    """Predefined pages in the system"""
    PAGE_CHOICES = [
        ('products_list', 'Products List'),
        ('marketing_list', 'Marketing List'),
        ('order_list', 'Order List'),
        ('media_plans', 'Media Plans'),
        ('offer_pricing_skus', 'Offer Pricing SKUs'),
        ('clients', 'Clients'),
        ('suppliers', 'Suppliers'),
        ('customer_support', 'Customer Support'),
        ('sales_reports', 'Sales Reports'),
        ('finance_accounting', 'Finance & Accounting'),
    ]
    
    name = models.CharField(max_length=50, choices=PAGE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.display_name


class Permission(models.Model):
    """User permissions for specific pages"""
    PERMISSION_CHOICES = [
        ('view', 'View'),
        ('edit', 'Edit'),
        ('create', 'Create'),
        ('delete', 'Delete'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions')
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='permissions')
    permission_type = models.CharField(max_length=10, choices=PERMISSION_CHOICES)
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='granted_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'page', 'permission_type']
    
    def __str__(self):
        return f"{self.user.email} - {self.page.display_name} - {self.permission_type}"


class Comment(models.Model):
    """Comments on pages with modification history"""
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_comments')
    
    def __str__(self):
        return f"Comment by {self.created_by.email} on {self.page.display_name}"
    
    def soft_delete(self, user):
        """Soft delete a comment"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()


class CommentHistory(models.Model):
    """Track modification history of comments"""
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='history')
    content = models.TextField()
    modified_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_modifications')
    modified_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=20, choices=[
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
    ])
    
    class Meta:
        ordering = ['-modified_at']
    
    def __str__(self):
        return f"{self.action} by {self.modified_by.email} at {self.modified_at}"


class UserSession(models.Model):
    """Track user sessions for activity monitoring"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Session for {self.user.email}"
