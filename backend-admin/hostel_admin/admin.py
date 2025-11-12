from django.contrib import admin
from .models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
	list_display = ('id', 'username', 'email', 'role', 'is_active', 'created_at')
	search_fields = ('username', 'email', 'first_name', 'last_name')
	list_filter = ('role', 'is_active')
	readonly_fields = ('id', 'created_at')
	ordering = ('-created_at',)

	fieldsets = (
		(None, {
			'fields': ('username', 'email', 'password_hash', 'role', 'is_active')
		}),
		('Tokens', {
			'fields': ('refresh_token', 'refresh_token_expiry_time')
		}),
		('Timestamps', {
			'fields': ('created_at', 'updated_at')
		}),
	)

