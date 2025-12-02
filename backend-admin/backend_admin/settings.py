import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ========== SECURITY SETTINGS ==========
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-fallback-key-change-this-immediately')

# SECURITY WARNING: don't run with debug turned on in production!
# Use environment variable, default to False for safety
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# HTTPS configuration - read from environment
USE_HTTPS = os.environ.get('DJANGO_USE_HTTPS', 'False').lower() == 'true'

# Parse ALLOWED_HOSTS from environment or use safe defaults
allowed_hosts_env = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
if allowed_hosts_env:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_env.split(',')]
else:
    ALLOWED_HOSTS = [
        'localhost',
        '127.0.0.1',
        'campushostels.duckdns.org',
        '.duckdns.org',
        '192.168.0.72',
    ]

# ========== INSTALLED APPS ==========
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

# ========== MIDDLEWARE ==========
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

# ========== DATABASE ==========

if DEBUG:
    # Use SQLite when DEBUG=True
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # Use PostgreSQL when DEBUG=False
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'campushostels'),
            'USER': os.environ.get('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
            'HOST': os.environ.get('DATABASE_HOST', 'db'),
            'PORT': os.environ.get('DATABASE_PORT', '5432'),
        }
    }

# ========== PASSWORD VALIDATION ==========
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ========== INTERNATIONALIZATION ==========
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ========== STATIC & MEDIA FILES ==========
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ========== DEFAULT PRIMARY KEY ==========
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========== SECURITY SETTINGS (PRODUCTION) ==========
# Always apply production security, but conditionally enable HTTPS
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# HTTPS-specific settings (only when USE_HTTPS=True)
if USE_HTTPS:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    # HTTP settings (temporary for development/testing)
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# CSRF origins for both HTTP and HTTPS
CSRF_TRUSTED_ORIGINS = [
    'https://campushostels.duckdns.org',
    'http://campushostels.duckdns.org',
    'https://www.campushostels.duckdns.org',
    'https://bookshelfgh.duckdns.org',
    'https://hostels.bookshelfgh.duckdns.org',
    'http://localhost',
    'http://127.0.0.1',
    'http://192.168.0.72',
]

# ========== JAZZMIN ADMIN THEME CONFIG ==========
JAZZMIN_SETTINGS = {
    "site_title": "Campus Hostels Admin",
    "site_header": "Campus Hostels",
    "site_brand": "Campus Hostels",
    "welcome_sign": "Welcome to Campus Hostels Admin",
    "copyright": "Campus Hostels Ltd",
    "search_model": "auth.User",
    "user_avatar": None,
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"app": "hostel_admin"},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": ["auth", "hostel_admin"],
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "hostel_admin.Property": "fas fa-building",
        "hostel_admin.Unit": "fas fa-door-closed",
        "hostel_admin.Tenant": "fas fa-user-tie",
        "hostel_admin.Payment": "fas fa-money-bill-wave",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": False,
    "custom_css": None,
    "custom_js": None,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": False,
    "accent": "accent-primary",
    "navbar": "navbar-white navbar-light",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-outline-primary",
        "secondary": "btn-outline-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}