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

IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rooms (
        room_id INT IDENTITY(1,1) PRIMARY KEY,
        room_number NVARCHAR(30) NOT NULL,
        room_type NVARCHAR(20) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_Rooms_status DEFAULT 'Available',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_Rooms_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_Rooms_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Rooms_room_number UNIQUE (room_number),
        CONSTRAINT CK_Rooms_room_type CHECK (room_type IN ('Aircon', 'Non-aircon')),
        CONSTRAINT CK_Rooms_status CHECK (status IN ('Available', 'Maintenance'))
    );
END
GO

IF OBJECT_ID('dbo.RoomNumberOptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RoomNumberOptions (
        room_number NVARCHAR(30) NOT NULL PRIMARY KEY,
        display_order INT NOT NULL CONSTRAINT DF_RoomNumberOptions_display_order DEFAULT 0
    );
END
GO

IF COL_LENGTH('dbo.RoomNumberOptions', 'display_order') IS NULL
BEGIN
    ALTER TABLE dbo.RoomNumberOptions
    ADD display_order INT NOT NULL CONSTRAINT DF_RoomNumberOptions_display_order DEFAULT 0;
END
GO

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
    INSERT (room_number, display_order) VALUES (source.room_number, source.display_order)
WHEN MATCHED THEN
    UPDATE SET display_order = source.display_order;
GO

DELETE FROM dbo.RoomNumberOptions
WHERE room_number NOT IN (
    '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
    '111', '112', '113', '114', '115',
    '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
    '211', '212', '213', '214', '215'
)
AND room_number NOT IN (SELECT room_number FROM dbo.Rooms);
GO

INSERT INTO dbo.RoomNumberOptions (room_number, display_order)
SELECT DISTINCT room_number
    , 999
FROM dbo.Rooms
WHERE room_number NOT IN (SELECT room_number FROM dbo.RoomNumberOptions);
GO

IF OBJECT_ID('dbo.CK_Rooms_status', 'C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP CONSTRAINT CK_Rooms_status;
END
GO

UPDATE dbo.Rooms
SET status = 'Available'
WHERE status NOT IN ('Available', 'Maintenance');
GO

ALTER TABLE dbo.Rooms
ADD CONSTRAINT CK_Rooms_status CHECK (status IN ('Available', 'Maintenance'));
GO

IF OBJECT_ID('dbo.DF_Rooms_daily_rate', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP CONSTRAINT DF_Rooms_daily_rate;
END
GO

IF OBJECT_ID('dbo.CK_Rooms_daily_rate', 'C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP CONSTRAINT CK_Rooms_daily_rate;
END
GO

IF COL_LENGTH('dbo.Rooms', 'daily_rate') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP COLUMN daily_rate;
END
GO

IF OBJECT_ID('dbo.DF_Rooms_capacity', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP CONSTRAINT DF_Rooms_capacity;
END
GO

IF OBJECT_ID('dbo.CK_Rooms_capacity', 'C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP CONSTRAINT CK_Rooms_capacity;
END
GO

IF COL_LENGTH('dbo.Rooms', 'capacity') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP COLUMN capacity;
END
GO

IF COL_LENGTH('dbo.Rooms', 'description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Rooms DROP COLUMN description;
END
GO

IF OBJECT_ID('dbo.FK_Rooms_RoomNumberOptions', 'F') IS NULL
BEGIN
    ALTER TABLE dbo.Rooms
    ADD CONSTRAINT FK_Rooms_RoomNumberOptions
    FOREIGN KEY (room_number) REFERENCES dbo.RoomNumberOptions(room_number);
END
GO

SELECT * FROM dbo.users;
SELECT * FROM dbo.RoomNumberOptions;
SELECT * FROM dbo.Rooms WHERE status = 'Available';
