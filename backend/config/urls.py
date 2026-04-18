"""Root URL configuration."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        "message": "UniFix Backend is running",
        "status": "online",
        "api_root": "/api/"
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.issues.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
