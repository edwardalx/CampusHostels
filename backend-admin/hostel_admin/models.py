from django.db import models
from django.utils import timezone
import uuid
from django.db import models
from decimal import Decimal, InvalidOperation
import re

class SafeDecimalField(models.DecimalField):
    """
    Improved SafeDecimalField that:
    1. Handles commas in numbers (2,000.50 → 2000.50)
    2. Preserves decimal places from floats (2000.0 → 2000.00)
    3. Better error handling
    """
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return None
        try:
            if isinstance(value, float):
                # Convert float and preserve decimal places
                decimal_places = getattr(self, 'decimal_places', 2)
                return Decimal(str(value)).quantize(
                    Decimal(f'1.{"0" * decimal_places}')
                )
            elif isinstance(value, (int, str)):
                return Decimal(str(value))
            else:
                return Decimal(str(value))
        except (TypeError, InvalidOperation, ValueError):
            # Return safe default
            return Decimal('0.00')
    
    def to_python(self, value):
        if value is None:
            return None
        if isinstance(value, Decimal):
            return value
        
        try:
            if isinstance(value, (int, float)):
                # Convert and format with proper decimal places
                decimal_places = getattr(self, 'decimal_places', 2)
                return Decimal(str(value)).quantize(
                    Decimal(f'1.{"0" * decimal_places}')
                )
            elif isinstance(value, str):
                # Clean the string (remove commas, currency symbols, etc.)
                cleaned = re.sub(r'[^\d\.\-]', '', value)
                if not cleaned:
                    return None
                
                decimal_value = Decimal(cleaned)
                # Apply decimal places formatting
                decimal_places = getattr(self, 'decimal_places', 2)
                return decimal_value.quantize(
                    Decimal(f'1.{"0" * decimal_places}')
                )
        except (TypeError, InvalidOperation, ValueError):
            return None
        
        return None
    
    def get_prep_value(self, value):
        """Prepare value for database storage"""
        if value is None:
            return None
        
        decimal_value = self.to_python(value)
        if decimal_value is None:
            return None
        
        # Ensure proper decimal places for storage
        decimal_places = getattr(self, 'decimal_places', 2)
        if decimal_places is not None:
            decimal_value = decimal_value.quantize(
                Decimal(f'1.{"0" * decimal_places}')
            )
        
        return decimal_value

class UnitType(models.IntegerChoices):
    SINGLE = 0, 'Single'
    DOUBLE = 1, 'Double'
    SHARED = 2, 'Shared'


class Tenant(models.Model):
    """Mirror of the .NET User entity."""
    id = models.IntegerField(primary_key=True, db_column='Id')
    username = models.CharField(max_length=150, db_column='Username')
    first_name = models.CharField(max_length=150, db_column='FirstName')
    last_name = models.CharField(max_length=150, db_column='LastName')
    email = models.EmailField(db_column='Email')
    password_hash = models.CharField(max_length=512, db_column='PasswordHash')
    role = models.CharField(max_length=50, default='Tenant', db_column='Role')
    refresh_token = models.CharField(max_length=512, null=True, blank=True, db_column='RefreshToken')
    refresh_token_expiry_time = models.DateTimeField(null=True, blank=True, db_column='RefreshTokenExpiryTime')
    created_at = models.DateTimeField(default=timezone.now, db_column='CreatedAt')
    updated_at = models.DateTimeField(null=True, blank=True, db_column='UpdatedAt')
    is_active = models.BooleanField(default=True, db_column='IsActive')

    class Meta:
        db_table = 'Users'  # Exact EF Core table name
        managed = False
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'

    def __str__(self):
        return f"{self.username} <{self.email}>"


class Property(models.Model):
    id = models.AutoField(primary_key=True, db_column='Id')
    name = models.CharField(max_length=250, db_column='Name')
    location = models.CharField(max_length=512, null=True, blank=True, db_column='Location')
    image_url = models.CharField(max_length=500, null=True, blank=True, db_column='ImageUrl')
    no_of_units = models.IntegerField(null=True, blank=True, db_column='NoOfUnits')
    no_of_floors = models.IntegerField(null=True, blank=True, db_column='NoOfFloors')
    availability = models.BooleanField(default=True, db_column='Availability')
    starting_price = SafeDecimalField( max_digits=10, decimal_places=2, default=120.00,null=True,blank=True,db_column="StartingPrice", verbose_name="Starting Price GH₵(per month)")
    class Meta:
        db_table = 'Properties'
        managed = False
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'

    def __str__(self):
        return f"{self.name} ({self.id})"


class Unit(models.Model):
    id = models.IntegerField(primary_key=True, db_column='Id')
    property_id = models.IntegerField(db_column='PropertyId')
    cost = SafeDecimalField(max_digits=12, decimal_places=2, null=True, blank=True, db_column='Cost')
    availability = models.BooleanField(default=True, db_column='Availability')
    image_url = models.CharField(max_length=500, null=True, blank=True, db_column='ImageUrl')
    floor = models.IntegerField(null=True, blank=True, db_column='Floor')
    max_no_of_people = models.IntegerField(null=True, blank=True, db_column='MaxNoOfPeople')
    room_number = models.CharField(max_length=50, null=True, blank=True, db_column='RoomNumber')
    unit_type = models.IntegerField(choices=UnitType.choices, null=True, blank=True, db_column='UnitType')

    class Meta:
        db_table = 'Units'
        managed = False
        verbose_name = 'Unit'
        verbose_name_plural = 'Units'

    def __str__(self):
        return f"Unit {self.room_number} (Property {self.property_id})"

class Tenancy(models.Model):
    id = models.IntegerField(primary_key=True, db_column='Id')
    unit_id = models.IntegerField(db_column='UnitId')
    tenant_id = models.UUIDField(db_column='TenantId')  # .NET Guid → UUID
    property_id = models.IntegerField(db_column='PropertyId')
    contract_start_date = models.DateTimeField(null=True, blank=True, db_column='ContractStartDate')
    contract_end_date = models.DateTimeField(null=True, blank=True, db_column='ContractEndDate')
    contract_duration_months = models.IntegerField(null=True, blank=True, db_column='ContractDurationMonths')
    total_amount_paid = SafeDecimalField(max_digits=12, decimal_places=2, null=True, blank=True, db_column='TotalAmountPaid')

    class Meta:
        db_table = 'TenancyAgreements'
        managed = False
        verbose_name = 'Tenancy Agreement'
        verbose_name_plural = 'Tenancy Agreements'

    def __str__(self):
        return f"Tenancy {self.id}: Unit {self.unit_id} - Tenant {self.tenant_id}"


class Payment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='Id')
    tenancy_agreement_id = models.IntegerField(null=True, blank=True, db_column='TenancyAgreementId')
    tenant_id = models.UUIDField(db_column='TenantId')  # .NET Guid → UUID
    unit_id = models.IntegerField(null=True, blank=True, db_column='UnitId')
    amount = SafeDecimalField(max_digits=12, decimal_places=2, db_column='Amount')
    created_at = models.DateTimeField(null=True, blank=True, db_column='CreatedAt')
    channel = models.CharField(max_length=100, null=True, blank=True, db_column='Channel')
    reference = models.CharField(max_length=250, null=True, blank=True, db_column='Reference')
    provider = models.IntegerField(null=True, blank=True, db_column='Provider')
    status = models.IntegerField(null=True, blank=True, db_column='Status')
    email = models.EmailField(null=True, blank=True, db_column='Email')
    phone = models.CharField(max_length=20, null=True, blank=True, db_column='Phone')
    currency = models.CharField(max_length=10, null=True, blank=True, db_column='Currency')

    class Meta:
        db_table = 'Payments'
        managed = False
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment {self.id}: {self.amount} by Tenant {self.tenant_id}"
