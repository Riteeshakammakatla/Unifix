from django.contrib import admin
from .models import Material, IssueMaterialUsage, MaterialRequest

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'material_type', 'available_quantity']

@admin.register(IssueMaterialUsage)
class IssueMaterialUsageAdmin(admin.ModelAdmin):
    list_display = ['issue', 'item_name', 'quantity', 'status', 'recorded_by']

@admin.register(MaterialRequest)
class MaterialRequestAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'quantity', 'supervisor', 'urgency', 'status', 'created_at']
    list_filter = ['status', 'urgency']
