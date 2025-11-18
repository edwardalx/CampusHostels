from django.db import models
from django.utils import timezone


class Tenant(models.Model):
    """Mirror of the .NET User entity so Django Admin can manage the table.

    Notes:
    - This model is set to managed = False so Django won't try to create/drop the
      existing database table created by the .NET application. It only provides
      an admin/UI layer over the existing data.
    - Column names are specified using db_column to match the EF Core migration
      (table name `Users` with columns like `Id`, `Username`, `Email`, ...).
    """

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
        db_table = 'Users'
        managed = False
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'

    def __str__(self):
        # Helpful representation in Django admin lists
        return f"{self.username} <{self.email}>"


# If you want to add more models reverse-engineered from the .NET domain, add
# them below following the same pattern (db_table and managed = False).
class Property(models.Model):
  """Approximate mapping for the .NET `Properties` table."""

  id = models.IntegerField(primary_key=True, db_column='Id')
  name = models.CharField(max_length=250, db_column='Name')
  location = models.CharField(max_length=512, null=True, blank=True, db_column='Location')
  image_url = models.CharField(max_length=500, null=True, blank=True, db_column='ImageUrl')
  no_of_units = models.IntegerField(null=True, blank=True, db_column='NoOfUnits')
  no_of_floors = models.IntegerField(null=True, blank=True, db_column='NoOfFloors')
  availability = models.IntegerField(null=True, blank=True, db_column='Availability')

  class Meta:
    db_table = 'Properties'
    managed = False
    verbose_name = 'Property'
    verbose_name_plural = 'Properties'

  def __str__(self):
    return f"{self.name} ({self.id})"


class Unit(models.Model):
  """Approximate mapping for the .NET `Units` table.
  Includes a decimal `cost` field (matches .NET decision to use decimal for money).
  """

  id = models.IntegerField(primary_key=True, db_column='Id')
  property_id = models.IntegerField(db_column='PropertyId')
  room_number = models.CharField(max_length=50, db_column='RoomNumber')
  cost = models.DecimalField(max_digits=12, decimal_places=2, db_column='Cost')
  availability = models.IntegerField(default=1, db_column='Availability')
  floor = models.IntegerField(null=True, blank=True, db_column='Floor')
  image_url = models.CharField(max_length=500, null=True, blank=True, db_column='ImageUrl')
  max_no_of_people = models.IntegerField(null=True, blank=True, db_column='MaxNoOfPeople')
  unit_type = models.IntegerField(null=True, blank=True, db_column='UnitType')

  class Meta:
    db_table = 'Units'
    managed = False
    verbose_name = 'Unit'
    verbose_name_plural = 'Units'

  def __str__(self):
    return f"Unit {self.room_number} (Property {self.property_id})"


class Tenancy(models.Model):
  """Approximate mapping for the .NET `TenancyAgreements` table."""

  id = models.IntegerField(primary_key=True, db_column='Id')
  unit_id = models.IntegerField(db_column='UnitId')
  tenant_id = models.CharField(max_length=150, db_column='TenantId')
  property_id = models.IntegerField(db_column='PropertyId')
  contract_start_date = models.DateTimeField(null=True, blank=True, db_column='ContractStartDate')
  contract_end_date = models.DateTimeField(null=True, blank=True, db_column='ContractEndDate')
  contract_duration_months = models.IntegerField(null=True, blank=True, db_column='ContractDurationMonths')
  total_amount_paid = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, db_column='TotalAmountPaid')

  class Meta:
    db_table = 'TenancyAgreements'
    managed = False
    verbose_name = 'Tenancy Agreement'
    verbose_name_plural = 'Tenancy Agreements'

  def __str__(self):
    return f"Tenancy {self.id}: Unit {self.unit_id} - Tenant {self.tenant_id}"


class Payment(models.Model):
  """Approximate mapping for the .NET `Payments` table."""

  id = models.IntegerField(primary_key=True, db_column='Id')
  tenancy_agreement_id = models.IntegerField(null=True, blank=True, db_column='TenancyAgreementId')
  tenant_id = models.CharField(max_length=150, db_column='TenantId')
  unit_id = models.IntegerField(null=True, blank=True, db_column='UnitId')
  amount = models.DecimalField(max_digits=12, decimal_places=2, db_column='Amount')
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
