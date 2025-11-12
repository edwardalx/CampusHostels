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
