import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from stock.models import UserProfile
from django.utils import timezone
from datetime import timedelta

def activate():
    # Try common usernames or just the first user
    target_user = User.objects.filter(is_superuser=True).first()
    if not target_user:
        target_user = User.objects.first()
    
    if target_user:
        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        profile.plan = 'elite'
        profile.subscription_end = timezone.now() + timedelta(days=7)
        profile.save()
        print(f"SUCCESS: Elite Plan activated for {target_user.username}")
    else:
        print("ERROR: No user found.")

if __name__ == "__main__":
    activate()
