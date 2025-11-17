IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BookShelf')
BEGIN
    CREATE DATABASE BookShelf;
END
GO
