import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-5j$cjl6t(r0z2%2j-r2%jr35la&1yyd%gv3y=o+81(11ow5zmk'

# Make sure DEBUG is a proper boolean   $env:DEBUG = "True"    

DEBUG = False   

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '192.168.0.72',           # your server IP
    'hostels.bookshelfgh.duckdns.org',
    '82.30.170.169',          # your public IP from logs
    '.bookshelfgh.duckdns.org',
    'campushostels.duckdns.org',  # ← ADD THIS
    '.duckdns.org',           # ← OR ADD WILDCARD FOR ALL DUCK DNS
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
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'campushostels',
            'USER': 'campushostels_user',
            'PASSWORD': 'Kwakubonsu',
            'HOST': 'db',  # Since PostgreSQL is exposed to host
            'PORT': '5432',       # Use the exposed port 5433, not 5432
        }
    }

# STATIC FILES
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # <-- convert to string

# Security (recommended for production)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    'http://hostels.bookshelfgh.duckdns.org',
    'https://hostels.bookshelfgh.duckdns.org',
    'http://bookshelfgh.duckdns.org', 
    'https://bookshelfgh.duckdns.org',
    'http://192.168.0.72', 
    'https://campushostels.local',
    'https://campushostels.duckdns.org',  # ← ADD FOR APP2
    'http://campushostels.duckdns.org',   # ← ADD FOR APP2
    'https://www.campushostels.duckdns.org',
    'http://www.campushostels.duckdns.org',
]
