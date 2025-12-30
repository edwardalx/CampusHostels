from django.contrib import admin
from .models import Tenant, Property, Unit, Tenancy, Payment


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


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'location', 'no_of_units', "starting_price", 'availability')
	search_fields = ('name', 'location')
	readonly_fields = ('id',)
	ordering = ('name',)

	fieldsets = (
		(None, {
			'fields': ('name', 'location', 'availability', 'starting_price')
		}),
		('Details', {
			'fields': ('no_of_units', 'no_of_floors', 'image_url')
		}),
	)


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'room_number', 'property_id', 'formatted_cost', 'availability', 'unit_type')
    search_fields = ('room_number',)
    list_filter = ('availability', 'property_id', 'unit_type')
    readonly_fields = ('id',)
    ordering = ('property_id', 'room_number')

    fieldsets = (
        (None, {
            'fields': ('property_id', 'room_number', 'cost', 'availability', 'unit_type')
        }),
        ('Details', {
            'fields': ('floor', 'max_no_of_people', 'image_url')
        }),
    )

    @admin.display(description='Cost')
    def formatted_cost(self, obj):
        return f"${obj.cost:.2f}" if obj.cost is not None else "-"


@admin.register(Tenancy)
class TenancyAdmin(admin.ModelAdmin):
	list_display = ('id', 'unit_id', 'tenant_id', 'contract_start_date', 'contract_end_date')
	search_fields = ('unit_id', 'tenant_id')
	list_filter = ('contract_start_date', 'property_id')
	readonly_fields = ('id',)
	ordering = ('-contract_start_date',)

	fieldsets = (
		(None, {
			'fields': ('unit_id', 'property_id', 'tenant_id', 'total_amount_paid')
		}),
		('Contract Dates', {
			'fields': ('contract_start_date', 'contract_end_date', 'contract_duration_months')
		}),
	)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
	list_display = ('id', 'tenant_id', 'tenancy_agreement_id', 'amount', 'created_at', 'status')
	search_fields = ('tenant_id', 'reference')
	list_filter = ('created_at', 'channel', 'status')
	readonly_fields = ('id', 'created_at')
	ordering = ('-created_at',)

	fieldsets = (
		(None, {
			'fields': ('tenant_id', 'tenancy_agreement_id', 'unit_id', 'amount', 'status')
		}),
		('Payment Info', {
			'fields': ('channel', 'provider', 'reference', 'email', 'phone')
		}),
		('Timestamp', {
			'fields': ('created_at', 'currency')
		}),
	)

