import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

username = 'admin_new'
email = os.environ.get('GMAIL_USER', 'admin@example.com')
password = 'admin123@#'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created successfully!")
else:
    user = User.objects.get(username=username)
    user.set_password(password)
    user.save()
    print(f"Password for superuser '{username}' updated successfully!")
