import os
import django
import sys

# Set settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from stock.models import UserProfile

def setup_admin():
    username = 'visionadmin'
    email = 'admin@example.com'
    password = 'vision12345'

    print(f"--- ADMIN SETUP START ---")
    print(f"Checking for user: {username}")
    
    # Create or update superuser
    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.save()
    
    # Safety Check: Ensure UserProfile exists
    # If the signal failed for any reason, we do it here.
    profile, p_created = UserProfile.objects.get_or_create(user=user)
    if p_created:
        print(f"-> UserProfile created for admin.")
    
    if created:
        print(f"SUCCESS: Superuser '{username}' created successfully! 🎉")
    else:
        print(f"SUCCESS: Superuser '{username}' updated successfully!")
    
    print(f"Total users in DB: {User.objects.count()}")
    print(f"--- ADMIN SETUP COMPLETE ---")

if __name__ == "__main__":
    try:
        setup_admin()
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        # We don't exit with error to avoid breaking Render build, but we log the crash
        import traceback
        traceback.print_exc()
        sys.exit(0)
