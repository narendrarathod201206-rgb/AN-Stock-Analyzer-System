"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings

from django.contrib.auth.models import User
from django.http import JsonResponse

def debug_users(request):
    users = list(User.objects.values('username', 'is_staff', 'is_superuser'))
    return JsonResponse({'users': users, 'db_path': settings.DATABASES['default']['NAME']})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('debug-db/', debug_users),
    path('stock/', include('stock.urls', namespace='stock')),
    path('', lambda request: redirect('stock:login' if not request.user.is_authenticated else 'stock:dashboard'), name='home'),
]

