from django.contrib import admin
from .models import Issue, IssueTimeline

class TimelineInline(admin.TabularInline):
    model = IssueTimeline
    extra = 0
    readonly_fields = ['created_at']

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'priority', 'status', 'created_by', 'assigned_supervisor', 'created_at']
    list_filter = ['status', 'priority', 'category']
    search_fields = ['title', 'description', 'location']
    inlines = [TimelineInline]
