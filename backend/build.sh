#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create Superuser (One-time or Update)
# This ensures visionadmin / vision12345 always exists
python create_super.py

# Collect static files
python manage.py collectstatic --no-input
