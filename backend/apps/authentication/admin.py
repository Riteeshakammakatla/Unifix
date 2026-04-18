from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from .models import User

class CustomUserCreationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    username = forms.CharField(required=False, help_text="Optional. Will use email if blank.")
    
    class Meta:
        model = User
        fields = ('email', 'username', 'role')

    def save(self, commit=True):
        user = super().save(commit=False)
        if not self.cleaned_data.get('username'):
            user.username = self.cleaned_data['email']
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    list_display = ('email', 'username', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'username', 'role', 'department', 'phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'role', 'password'),
        }),
    )
    
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
