import os
import django
import sys

# Set settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def setup_admin():
    username = 'visionadmin'
    email = 'admin@example.com'
    password = 'vision12345'

    print(f"Checking for user: {username}")
    
    # Create or update superuser
    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.save()
    
    if created:
        print(f"SUCCESS: Superuser '{username}' created successfully!")
    else:
        print(f"SUCCESS: Superuser '{username}' password/permissions updated!")
    print(f"Total users in DB: {User.objects.count()}")

if __name__ == "__main__":
    try:
        setup_admin()
    except Exception as e:
        print(f"ERROR creating superuser: {e}")
        sys.exit(0) # Don't fail the build, just log it
