import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'replace-me-in-prod')

# Make sure DEBUG is a proper boolean   $env:DEBUG = "True"    
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1')    

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '192.168.0.72',           # your server IP
    'hostels.bookshelfgh.duckdns.org',
    '82.30.170.169',          # your public IP from logs
]
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'hostel_admin',   
]
JAZZMIN_SETTINGS = {
    "site_title": "Your Admin",
    "site_header": "Your Administration",
    "site_brand": "Your Site",
    "welcome_sign": "Welcome to the administration",
    "show_ui_builder": True,
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend_admin.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_admin.wsgi.application'

# Database
if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
  DATABASES = {
    'default': dj_database_url.config(
        default="postgres://campushostels_user:Kwakubonsu@postgres:5432/campushostels",
        conn_max_age=600,
    )
}

# STATIC FILES
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # <-- convert to string

# Security (recommended for production)
CSRF_TRUSTED_ORIGINS = ['http://192.168.0.72', 'https://campushostels.local']
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
