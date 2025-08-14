from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Page, Permission, Comment, CommentHistory, UserSession


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'is_active', 'created_at', 'last_activity')
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'last_activity')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role'),
        }),
    )


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name', 'created_at')
    search_fields = ('name', 'display_name')
    ordering = ('name',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'page', 'permission_type', 'granted_by', 'granted_at')
    list_filter = ('permission_type', 'page', 'granted_at')
    search_fields = ('user__email', 'page__display_name')
    ordering = ('-granted_at',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('content', 'page', 'created_by', 'created_at', 'is_deleted')
    list_filter = ('page', 'is_deleted', 'created_at')
    search_fields = ('content', 'created_by__email', 'page__display_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CommentHistory)
class CommentHistoryAdmin(admin.ModelAdmin):
    list_display = ('comment', 'action', 'modified_by', 'modified_at')
    list_filter = ('action', 'modified_at')
    search_fields = ('comment__content', 'modified_by__email')
    ordering = ('-modified_at',)
    readonly_fields = ('modified_at',)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_key', 'created_at', 'last_activity', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'session_key')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'last_activity')
