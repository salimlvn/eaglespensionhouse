IF DB_ID('CapstoneDB') IS NULL
BEGIN
    CREATE DATABASE CapstoneDB;
END
GO

USE CapstoneDB;
GO

IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(120) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        contact_number NVARCHAR(30) NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_users_email UNIQUE (email),
        CONSTRAINT UQ_users_contact_number UNIQUE (contact_number)
    );
END
GO

SELECT * FROM dbo.users;