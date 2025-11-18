# backend-admin (Django admin)

This document explains how to run the Django admin app in `backend-admin/` and how the admin models map to the canonical .NET database tables used by the `backend-api` project.

## Purpose

- The Django admin is preserved so non-developer users can manage records in the development SQLite database (`db.sqlite3`).
- The Django model `Tenant` (in `hostel_admin/models.py`) is a forward-engineered, unmanaged model that maps to the `Users` table which is authored by the .NET backend. This allows using Django Admin to view/edit rows from the `Users` table without Django running migrations against it.

## Important mapping decision

- The canonical tenant/user model for the whole project is the .NET entity in `backend-api/CampusHostels.API/Domain/Entities/Users.cs`.
- Django's forward-engineered model is named `Tenant` (to avoid colliding with Django's built-in `auth.User`). It is declared with `managed = False` and `db_table = 'Users'` and `db_column` attributes so each field maps exactly to the underlying table/column names.

Notes:
- Because the model is unmanaged, Django will not create, alter or delete the `Users` table. Any schema changes must be performed from the .NET side (EF Core) and then reflected in this model if column names/types change.
- Editing certain sensitive fields (password hash, refresh tokens) via admin is possible but discouraged unless you understand the hash algorithm and authentication flows used by the .NET backend.

## How to run locally (Windows PowerShell)

1. Open PowerShell and change to this folder:

   cd "c:\Users\obedd\MyAlxProjects\CampusHostels\backend-admin"

2. Create and activate a Python virtual environment (if you don't have one already):

   python -m venv .venv; .\.venv\Scripts\Activate.ps1

3. Install dependencies (project has `requirements.txt`):

   pip install -r requirements.txt

4. Ensure Django settings point to the local SQLite database in development mode. By default, `backend_admin/settings.py` is configured to use `db.sqlite3` when `DEBUG = True`.

5. (Optional) If you need to inspect the database schema directly, you can open `db.sqlite3` with an SQLite browser or the `sqlite3` CLI.

6. Create a Django superuser so you can log in to admin (only if using the Django-managed auth tables):

   # If you use Django's auth (the project already includes the admin app and auth), create a superuser
   python manage.py createsuperuser

   # If you prefer to set a password manually you can also use the shell
   python manage.py shell
   >>> from django.contrib.auth.models import User
   >>> User.objects.create_superuser('admin', 'admin@example.com', 'password')

7. Run the dev server:

   python manage.py runserver 0.0.0.0:8000

8. Open the admin UI in your browser at http://127.0.0.1:8000/admin/ and log in with the superuser credentials.

## Using the Tenant model in Admin

- The `Tenant` model is registered in `hostel_admin/admin.py`. It appears in the admin with a configured `list_display`, `search_fields`, `list_filter` and `readonly_fields` for convenience.
- Because the model maps to the same table used by .NET, changes made in the admin will be visible to the .NET backend immediately because they share the same SQLite file.

## Caveats and maintenance notes

- Schema drift: If you change field names, types or remove columns in the .NET `Users` entity, update `hostel_admin/models.py` to match the new schema. Keep `db_table` and `db_column` attributes in sync.
- Money types: The .NET codebase recently switched currency/money fields to `decimal`. If column types change at the database level, update the Django field types accordingly and verify compatibility. Because the Django model is unmanaged, Django won't create migrations to change the column type for you.
- Backups: When working on the shared `db.sqlite3`, make a copy of the file before large migrations or data edits.

## Next steps (suggested)

- If you want Django admin to manage additional .NET tables (Properties, Units, Tenancies, Payments), create additional unmanaged models in `hostel_admin/models.py` that map to those tables (use `db_table` and `db_column` like `Tenant`).
- If you plan to move to a different DB in production (Postgres), consider setting up a replication/seed mechanism or an admin UI that can operate on the production DB safely — do not point the local Django admin to production credentials.

## Contact

If you need help mapping additional tables or keeping Django models in sync with the .NET domain, open an issue in the repo or ping the maintainers.
