-- SQL Server schema for Eagle's Pension House auth and room inventory.
-- Create the application database if it does not exist yet.
IF DB_ID('CapstoneDB') IS NULL
BEGIN
    CREATE DATABASE CapstoneDB;
END
GO

USE CapstoneDB;
GO

-- Store guest accounts used by the signup and login pages.
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        -- Internal user id.
        user_id INT IDENTITY(1,1) PRIMARY KEY,

        -- Guest profile details.
        full_name NVARCHAR(120) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        contact_number NVARCHAR(30) NOT NULL,

        -- Passwords are stored as salted hashes, not plain text.
        password_hash NVARCHAR(255) NOT NULL,

        -- Account status and audit timestamps.
        is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),

        -- Prevent duplicate guest accounts.
        CONSTRAINT UQ_users_email UNIQUE (email),
        CONSTRAINT UQ_users_contact_number UNIQUE (contact_number)
    );
END
GO

-- Store the room numbers that admins can choose from.
IF OBJECT_ID('dbo.RoomNumberOptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RoomNumberOptions (
        -- Room number shown in the admin room form.
        room_number NVARCHAR(30) NOT NULL PRIMARY KEY,

        -- Keeps the dropdown in a predictable order.
        display_order INT NOT NULL CONSTRAINT DF_RoomNumberOptions_display_order DEFAULT 0
    );
END
GO

-- Add display_order for older databases that already had RoomNumberOptions.
IF COL_LENGTH('dbo.RoomNumberOptions', 'display_order') IS NULL
BEGIN
    ALTER TABLE dbo.RoomNumberOptions
    ADD display_order INT NOT NULL CONSTRAINT DF_RoomNumberOptions_display_order DEFAULT 0;
END
GO

-- Seed or update the standard room number choices used by the frontend.
MERGE dbo.RoomNumberOptions AS target
USING (VALUES
    ('101', 1),
    ('102', 2),
    ('103', 3),
    ('104', 4),
    ('105', 5),
    ('106', 6),
    ('107', 7),
    ('108', 8),
    ('109', 9),
    ('110', 10),
    ('111', 11),
    ('112', 12),
    ('113', 13),
    ('114', 14),
    ('115', 15),
    ('201', 16),
    ('202', 17),
    ('203', 18),
    ('204', 19),
    ('205', 20),
    ('206', 21),
    ('207', 22),
    ('208', 23),
    ('209', 24),
    ('210', 25),
    ('211', 26),
    ('212', 27),
    ('213', 28),
    ('214', 29),
    ('215', 30)
) AS source (room_number, display_order)
ON target.room_number = source.room_number
WHEN NOT MATCHED THEN
    INSERT (room_number, display_order)
    VALUES (source.room_number, source.display_order)
WHEN MATCHED THEN
    UPDATE SET display_order = source.display_order;
GO

-- Store rooms created from the admin room inventory page.
IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rooms (
        -- Internal room id.
        room_id INT IDENTITY(1,1) PRIMARY KEY,

        -- Room details selected by the admin.
        room_number NVARCHAR(30) NOT NULL,
        room_type NVARCHAR(20) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_Rooms_status DEFAULT 'Available',

        -- Audit timestamps for room records.
        created_at DATETIME2 NOT NULL CONSTRAINT DF_Rooms_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_Rooms_updated_at DEFAULT SYSUTCDATETIME(),

        -- Keep room records valid and unique.
        CONSTRAINT UQ_Rooms_room_number UNIQUE (room_number),
        CONSTRAINT CK_Rooms_room_type CHECK (room_type IN ('Aircon', 'Non-aircon')),
        CONSTRAINT CK_Rooms_status CHECK (status IN ('Available', 'Maintenance'))
    );
END
GO

-- Clean old invalid room values before checks are enforced.
UPDATE dbo.Rooms
SET room_type = 'Non-aircon'
WHERE room_type NOT IN ('Aircon', 'Non-aircon');
GO

UPDATE dbo.Rooms
SET status = 'Available'
WHERE status NOT IN ('Available', 'Maintenance');
GO

-- Add missing checks for older databases that already had Rooms.
IF OBJECT_ID('dbo.CK_Rooms_room_type', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.Rooms
    ADD CONSTRAINT CK_Rooms_room_type CHECK (room_type IN ('Aircon', 'Non-aircon'));
END
GO

IF OBJECT_ID('dbo.CK_Rooms_status', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.Rooms
    ADD CONSTRAINT CK_Rooms_status CHECK (status IN ('Available', 'Maintenance'));
END
GO

-- Preserve any existing room numbers before adding the foreign key.
INSERT INTO dbo.RoomNumberOptions (room_number, display_order)
SELECT DISTINCT room_number, 999
FROM dbo.Rooms AS rooms
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.RoomNumberOptions AS room_options
    WHERE room_options.room_number = rooms.room_number
);
GO

-- Link each room to a valid room number option.
IF OBJECT_ID('dbo.FK_Rooms_RoomNumberOptions', 'F') IS NULL
BEGIN
    ALTER TABLE dbo.Rooms
    ADD CONSTRAINT FK_Rooms_RoomNumberOptions
    FOREIGN KEY (room_number) REFERENCES dbo.RoomNumberOptions(room_number);
END
GO
