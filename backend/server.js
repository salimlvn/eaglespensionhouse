const express = require('express');
const dotenv = require('dotenv');
const sql = require('mssql');
const sqlWindows = require('mssql/msnodesqlv8');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const DATA_DIRECTORY = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIRECTORY, 'users.json');
const ROOMS_DATA_FILE = path.join(DATA_DIRECTORY, 'rooms.json');
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'schema.sql');
const ENABLE_FILE_STORAGE_FALLBACK = String(process.env.ENABLE_FILE_STORAGE_FALLBACK || 'false').toLowerCase() === 'true';
const USER_FIELD_LIMITS = Object.freeze({
  fullName: 120,
  email: 255,
  contactNumber: 30,
});
const ROOM_FIELD_LIMITS = Object.freeze({
  roomNumber: 30,
  roomType: 20,
  status: 20,
});
const ROOM_TYPES = Object.freeze(['Aircon', 'Non-aircon']);
const ROOM_STATUSES = Object.freeze(['Available', 'Maintenance']);
const ROOM_NUMBER_OPTIONS = Object.freeze([
  '101',
  '102',
  '103',
  '104',
  '105',
  '106',
  '107',
  '108',
  '109',
  '110',
  '111',
  '112',
  '113',
  '114',
  '115',
  '201',
  '202',
  '203',
  '204',
  '205',
  '206',
  '207',
  '208',
  '209',
  '210',
  '211',
  '212',
  '213',
  '214',
  '215',
]);
const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

let storagePromise;
let schemaDefinitionPromise;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/api/health', async (_, res) => {
  try {
    const storage = await getStorage();

    res.json({
      ok: true,
      storage: storage.label,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: getReadableErrorMessage(error),
    });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const payload = sanitizeSignupPayload(req.body);
    validateSignupPayload(payload);

    const storage = await getStorage();
    const existingEmail = await storage.findUserByEmail(payload.email);

    if (existingEmail) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const existingContact = await storage.findUserByContactNumber(payload.contactNumber);

    if (existingContact) {
      return res.status(409).json({ message: 'That contact number is already in use.' });
    }

    const passwordHash = createPasswordHash(payload.password);
    const user = await storage.createUser({
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      contactNumber: payload.contactNumber,
    });

    return res.status(201).json({
      message: 'Account created successfully. Please log in.',
      sessionToken: createSessionToken(),
      user: serializeUser(user),
    });
  } catch (error) {
    return handleApiError(error, res);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const payload = sanitizeLoginPayload(req.body);
    validateLoginPayload(payload);

    const storage = await getStorage();
    const user = await storage.findUserByEmail(payload.email);

    if (!user || !verifyPassword(payload.password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.is_active === false || user.is_active === 0) {
      return res.status(403).json({ message: 'This account is currently inactive.' });
    }

    return res.json({
      message: 'Login successful.',
      sessionToken: createSessionToken(),
      user: serializeUser(user),
    });
  } catch (error) {
    return handleApiError(error, res);
  }
});

app.get('/api/rooms', async (_, res) => {
  try {
    const storage = await getStorage();
    const rooms = await storage.listRooms();

    return res.json({
      message: 'Rooms loaded.',
      rooms: rooms.map(serializeRoom),
    });
  } catch (error) {
    return handleApiError(error, res);
  }
});

app.get('/api/rooms/options', async (_, res) => {
  try {
    const storage = await getStorage();
    const roomNumbers = await storage.listRoomNumberOptions();

    return res.json({
      message: 'Room number options loaded.',
      roomNumbers,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const payload = sanitizeRoomPayload(req.body);
    validateRoomPayload(payload);

    const storage = await getStorage();
    const roomNumberOptions = await storage.listRoomNumberOptions();

    if (!roomNumberOptions.includes(payload.roomNumber)) {
      return res.status(400).json({ message: 'Please choose a room number from the list.' });
    }

    const duplicate = await storage.findRoomByNumber(payload.roomNumber);

    if (duplicate) {
      return res.status(409).json({ message: 'A room with that room number already exists.' });
    }

    const room = await storage.createRoom(payload);

    return res.status(201).json({
      message: 'Room added successfully.',
      room: serializeRoom(room),
    });
  } catch (error) {
    return handleApiError(error, res);
  }
});

app.put('/api/rooms/:roomId', async (req, res) => {
  try {
    const roomId = parseRoomId(req.params.roomId);
    const payload = sanitizeRoomPayload(req.body);
    validateRoomPayload(payload);

    const storage = await getStorage();
    const roomNumberOptions = await storage.listRoomNumberOptions();

    if (!roomNumberOptions.includes(payload.roomNumber)) {
      return res.status(400).json({ message: 'Please choose a room number from the list.' });
    }

    const duplicate = await storage.findRoomByNumber(payload.roomNumber, roomId);

    if (duplicate) {
      return res.status(409).json({ message: 'A room with that room number already exists.' });
    }

    const room = await storage.updateRoom(roomId, payload);

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.json({
      message: 'Room updated successfully.',
      room: serializeRoom(room),
    });
  } catch (error) {
    return handleApiError(error, res);
  }
});

app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const roomId = parseRoomId(req.params.roomId);
    const storage = await getStorage();
    const deleted = await storage.deleteRoom(roomId);

    if (!deleted) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.json({ message: 'Room deleted successfully.' });
  } catch (error) {
    return handleApiError(error, res);
  }
});

async function getStorage() {
  try {
    if (!storagePromise) {
      storagePromise = initializeStorage();
    }

    return await storagePromise;
  } catch (error) {
    storagePromise = undefined;
    throw error;
  }
}

async function initializeStorage() {
  if (!hasDatabaseConfiguration()) {
    throw createRequestError(
      'Database configuration is missing. Set your MSSQL server settings in backend/.env before using auth.',
      500,
    );
  }

  try {
    const schemaDefinition = await getSchemaDefinition();
    const sqlModule = getSqlModule();
    const bootstrapPool = await new sqlModule.ConnectionPool(getDatabaseConfig('master')).connect();

    try {
      await runSqlBatches(bootstrapPool, schemaDefinition.setupBatches);
    } finally {
      await bootstrapPool.close();
    }

    const appPool = await new sqlModule.ConnectionPool(getDatabaseConfig(schemaDefinition.databaseName)).connect();
    await runSqlBatches(appPool, schemaDefinition.applicationBatches);

    console.log(`Connected to SQL Server for auth storage using ${usesWindowsAuth() ? 'Windows Authentication' : 'SQL Authentication'}.`);

    return createSqlStorage(appPool, sqlModule);
  } catch (error) {
    if (ENABLE_FILE_STORAGE_FALLBACK) {
      console.warn(`SQL storage unavailable, falling back to file storage: ${error.message}`);
      await ensureDataFile();
      return createFileStorage();
    }

    throw createRequestError(getDatabaseConnectionHelp(error), 500);
  }
}

function hasDatabaseConfiguration() {
  return Boolean(process.env.DB_CONNECTION_STRING) || Boolean(process.env.DB_SERVER) || Boolean(process.env.DB_INSTANCE);
}

function getSqlModule() {
  return usesWindowsAuth() ? sqlWindows : sql;
}

function usesWindowsAuth() {
  return String(process.env.DB_AUTH_MODE || 'windows').toLowerCase() === 'windows';
}

function getDatabaseConfig(databaseName = process.env.DB_NAME || 'CapstoneDB') {
  if (process.env.DB_CONNECTION_STRING) {
    return overrideConnectionStringDatabase(process.env.DB_CONNECTION_STRING, databaseName);
  }

  const encrypt = String(process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true';
  const trustServerCertificate =
    String(process.env.DB_TRUST_SERVER_CERTIFICATE || 'true').toLowerCase() === 'true';

  if (usesWindowsAuth()) {
    const connectionString = buildWindowsConnectionString({
      databaseName,
      encrypt,
      trustServerCertificate,
    });

    return {
      connectionString,
      requestTimeout: 15000,
      connectionTimeout: 15000,
      options: {
        trustedConnection: true,
        trustServerCertificate,
      },
    };
  }

  return {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    database: databaseName,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt,
      trustServerCertificate,
    },
  };
}

function buildWindowsConnectionString({ databaseName, encrypt, trustServerCertificate }) {
  const driver = process.env.DB_DRIVER || 'ODBC Driver 17 for SQL Server';
  const serverHost = String(process.env.DB_SERVER || 'localhost').trim();
  const serverPort = String(process.env.DB_PORT || '').trim();
  const instanceName = String(process.env.DB_INSTANCE || '').trim();
  const serverTarget = resolveSqlServerTarget(serverHost, serverPort, instanceName);

  return [
    `Driver={${driver}}`,
    `Server=${serverTarget}`,
    `Database=${databaseName}`,
    'Trusted_Connection=Yes',
    `Encrypt=${encrypt ? 'Yes' : 'No'}`,
    `TrustServerCertificate=${trustServerCertificate ? 'Yes' : 'No'}`,
  ].join(';');
}

function resolveSqlServerTarget(serverHost, serverPort, instanceName) {
  if (serverPort) {
    return `${serverHost},${serverPort}`;
  }

  // If DB_SERVER already includes an instance name like "(localdb)\\MSSQLLocalDB"
  // or "localhost\\SQLEXPRESS", do not append DB_INSTANCE again.
  if (serverHost.includes('\\')) {
    return serverHost;
  }

  return instanceName ? `${serverHost}\\${instanceName}` : serverHost;
}

function createSqlStorage(pool, sqlModule) {
  return {
    label: 'sqlserver',
    async findUserByEmail(email) {
      const result = await pool
        .request()
        .input('email', sqlModule.NVarChar(255), email)
        .query(`
          SELECT TOP 1
            user_id,
            full_name,
            email,
            password_hash,
            contact_number,
            is_active,
            created_at,
            updated_at
          FROM dbo.users
          WHERE email = @email
        `);

      return result.recordset[0] || null;
    },
    async findUserByContactNumber(contactNumber) {
      const result = await pool
        .request()
        .input('contactNumber', sqlModule.NVarChar(30), contactNumber)
        .query(`
          SELECT TOP 1
            user_id,
            full_name,
            email,
            password_hash,
            contact_number,
            is_active,
            created_at,
            updated_at
          FROM dbo.users
          WHERE contact_number = @contactNumber
        `);

      return result.recordset[0] || null;
    },
    async createUser(user) {
      const result = await pool
        .request()
        .input('fullName', sqlModule.NVarChar(USER_FIELD_LIMITS.fullName), user.fullName)
        .input('email', sqlModule.NVarChar(USER_FIELD_LIMITS.email), user.email)
        .input('passwordHash', sqlModule.NVarChar(255), user.passwordHash)
        .input('contactNumber', sqlModule.NVarChar(USER_FIELD_LIMITS.contactNumber), user.contactNumber)
        .query(`
          INSERT INTO dbo.users (full_name, email, password_hash, contact_number)
          OUTPUT
            inserted.user_id,
            inserted.full_name,
            inserted.email,
            inserted.password_hash,
            inserted.contact_number,
            inserted.is_active,
            inserted.created_at,
            inserted.updated_at
          VALUES (@fullName, @email, @passwordHash, @contactNumber)
        `);

      return result.recordset[0];
    },
    async listRooms() {
      const result = await pool.request().query(`
        SELECT
          room_id,
          room_number,
          room_type,
          status,
          created_at,
          updated_at
        FROM dbo.Rooms
        ORDER BY room_id DESC
      `);

      return result.recordset;
    },
    async listRoomNumberOptions() {
      const result = await pool.request().query(`
        SELECT room_number
        FROM dbo.RoomNumberOptions
        ORDER BY display_order, room_number
      `);

      return sortRoomNumbers(result.recordset.map((entry) => entry.room_number));
    },
    async findRoomByNumber(roomNumber, excludedRoomId) {
      const request = pool
        .request()
        .input('roomNumber', sqlModule.NVarChar(ROOM_FIELD_LIMITS.roomNumber), roomNumber);
      const excludeClause = Number.isInteger(excludedRoomId) ? 'AND room_id <> @excludedRoomId' : '';

      if (Number.isInteger(excludedRoomId)) {
        request.input('excludedRoomId', sqlModule.Int, excludedRoomId);
      }

      const result = await request.query(`
        SELECT TOP 1
          room_id,
          room_number,
          room_type,
          status,
          created_at,
          updated_at
        FROM dbo.Rooms
        WHERE room_number = @roomNumber
        ${excludeClause}
      `);

      return result.recordset[0] || null;
    },
    async createRoom(room) {
      const result = await pool
        .request()
        .input('roomNumber', sqlModule.NVarChar(ROOM_FIELD_LIMITS.roomNumber), room.roomNumber)
        .input('roomType', sqlModule.NVarChar(ROOM_FIELD_LIMITS.roomType), room.roomType)
        .input('status', sqlModule.NVarChar(ROOM_FIELD_LIMITS.status), room.status)
        .query(`
          INSERT INTO dbo.Rooms (room_number, room_type, status)
          OUTPUT
            inserted.room_id,
            inserted.room_number,
            inserted.room_type,
            inserted.status,
            inserted.created_at,
            inserted.updated_at
          VALUES (@roomNumber, @roomType, @status)
        `);

      return result.recordset[0];
    },
    async updateRoom(roomId, room) {
      const result = await pool
        .request()
        .input('roomId', sqlModule.Int, roomId)
        .input('roomNumber', sqlModule.NVarChar(ROOM_FIELD_LIMITS.roomNumber), room.roomNumber)
        .input('roomType', sqlModule.NVarChar(ROOM_FIELD_LIMITS.roomType), room.roomType)
        .input('status', sqlModule.NVarChar(ROOM_FIELD_LIMITS.status), room.status)
        .query(`
          UPDATE dbo.Rooms
          SET
            room_number = @roomNumber,
            room_type = @roomType,
            status = @status,
            updated_at = SYSUTCDATETIME()
          OUTPUT
            inserted.room_id,
            inserted.room_number,
            inserted.room_type,
            inserted.status,
            inserted.created_at,
            inserted.updated_at
          WHERE room_id = @roomId
        `);

      return result.recordset[0] || null;
    },
    async deleteRoom(roomId) {
      const result = await pool
        .request()
        .input('roomId', sqlModule.Int, roomId)
        .query('DELETE FROM dbo.Rooms WHERE room_id = @roomId');

      return result.rowsAffected[0] > 0;
    },
  };
}

function createFileStorage() {
  return {
    label: 'file',
    async findUserByEmail(email) {
      const users = await readUsersFromFile();
      return users.find((user) => user.email === email) || null;
    },
    async findUserByContactNumber(contactNumber) {
      const users = await readUsersFromFile();
      return users.find((user) => user.contact_number === contactNumber) || null;
    },
    async createUser(user) {
      const users = await readUsersFromFile();
      const nextId = users.length === 0 ? 1 : Math.max(...users.map((entry) => entry.user_id)) + 1;
      const timestamp = new Date().toISOString();
      const record = {
        user_id: nextId,
        full_name: user.fullName,
        email: user.email,
        password_hash: user.passwordHash,
        contact_number: user.contactNumber,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      };

      users.push(record);
      await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));

      return record;
    },
    async listRooms() {
      const rooms = await readRoomsFromFile();
      return rooms.sort((left, right) => right.room_id - left.room_id);
    },
    async listRoomNumberOptions() {
      const rooms = await readRoomsFromFile();
      return sortRoomNumbers(Array.from(new Set([...ROOM_NUMBER_OPTIONS, ...rooms.map((room) => room.room_number)])));
    },
    async findRoomByNumber(roomNumber, excludedRoomId) {
      const rooms = await readRoomsFromFile();
      return rooms.find((room) => room.room_number === roomNumber && room.room_id !== excludedRoomId) || null;
    },
    async createRoom(room) {
      const rooms = await readRoomsFromFile();
      const nextId = rooms.length === 0 ? 1 : Math.max(...rooms.map((entry) => entry.room_id)) + 1;
      const timestamp = new Date().toISOString();
      const record = {
        room_id: nextId,
        room_number: room.roomNumber,
        room_type: room.roomType,
        status: room.status,
        created_at: timestamp,
        updated_at: timestamp,
      };

      rooms.push(record);
      await fs.writeFile(ROOMS_DATA_FILE, JSON.stringify(rooms, null, 2));

      return record;
    },
    async updateRoom(roomId, room) {
      const rooms = await readRoomsFromFile();
      const roomIndex = rooms.findIndex((entry) => entry.room_id === roomId);

      if (roomIndex === -1) {
        return null;
      }

      rooms[roomIndex] = {
        ...rooms[roomIndex],
        room_number: room.roomNumber,
        room_type: room.roomType,
        status: room.status,
        updated_at: new Date().toISOString(),
      };

      await fs.writeFile(ROOMS_DATA_FILE, JSON.stringify(rooms, null, 2));
      return rooms[roomIndex];
    },
    async deleteRoom(roomId) {
      const rooms = await readRoomsFromFile();
      const nextRooms = rooms.filter((entry) => entry.room_id !== roomId);

      if (nextRooms.length === rooms.length) {
        return false;
      }

      await fs.writeFile(ROOMS_DATA_FILE, JSON.stringify(nextRooms, null, 2));
      return true;
    },
  };
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]');
  }
}

async function ensureRoomsDataFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(ROOMS_DATA_FILE);
  } catch {
    await fs.writeFile(ROOMS_DATA_FILE, '[]');
  }
}

async function readUsersFromFile() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readRoomsFromFile() {
  await ensureRoomsDataFile();
  const raw = await fs.readFile(ROOMS_DATA_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeSignupPayload(payload = {}) {
  return {
    fullName: String(payload.fullName || '').trim(),
    email: normalizeEmail(payload.email),
    password: String(payload.password || ''),
    confirmPassword: String(payload.confirmPassword || ''),
    contactNumber: String(payload.contactNumber || '').trim(),
  };
}

function sanitizeLoginPayload(payload = {}) {
  return {
    email: normalizeEmail(payload.email),
    password: String(payload.password || ''),
  };
}

function sanitizeRoomPayload(payload = {}) {
  return {
    roomNumber: String(payload.roomNumber || '').trim(),
    roomType: normalizeRoomChoice(payload.roomType, ROOM_TYPES),
    status: normalizeRoomChoice(payload.status || 'Available', ROOM_STATUSES),
  };
}

function validateSignupPayload(payload) {
  if (!payload.fullName || !payload.email || !payload.password || !payload.confirmPassword || !payload.contactNumber) {
    throw createRequestError('Please complete all sign-up fields.', 400);
  }

  if (payload.fullName.length > USER_FIELD_LIMITS.fullName) {
    throw createRequestError(`Full name must be ${USER_FIELD_LIMITS.fullName} characters or fewer.`, 400);
  }

  if (!isValidEmail(payload.email)) {
    throw createRequestError('Please enter a valid email address.', 400);
  }

  if (payload.email.length > USER_FIELD_LIMITS.email) {
    throw createRequestError(`Email must be ${USER_FIELD_LIMITS.email} characters or fewer.`, 400);
  }

  if (payload.contactNumber.length > USER_FIELD_LIMITS.contactNumber) {
    throw createRequestError(`Contact number must be ${USER_FIELD_LIMITS.contactNumber} characters or fewer.`, 400);
  }

  if (!isStrongPassword(payload.password)) {
    throw createRequestError(STRONG_PASSWORD_MESSAGE, 400);
  }

  if (payload.password !== payload.confirmPassword) {
    throw createRequestError('Passwords do not match.', 400);
  }
}

function validateLoginPayload(payload) {
  if (!payload.email || !payload.password) {
    throw createRequestError('Email and password are required.', 400);
  }

  if (!isValidEmail(payload.email)) {
    throw createRequestError('Please enter a valid email address.', 400);
  }

  if (payload.email.length > USER_FIELD_LIMITS.email) {
    throw createRequestError(`Email must be ${USER_FIELD_LIMITS.email} characters or fewer.`, 400);
  }
}

function validateRoomPayload(payload) {
  if (!payload.roomNumber || !payload.roomType || !payload.status) {
    throw createRequestError('Room number, type, and status are required.', 400);
  }

  if (payload.roomNumber.length > ROOM_FIELD_LIMITS.roomNumber) {
    throw createRequestError(`Room number must be ${ROOM_FIELD_LIMITS.roomNumber} characters or fewer.`, 400);
  }

  if (!ROOM_TYPES.includes(payload.roomType)) {
    throw createRequestError('Room type must be Aircon or Non-aircon.', 400);
  }

  if (!ROOM_STATUSES.includes(payload.status)) {
    throw createRequestError('Room status is invalid.', 400);
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRoomChoice(value, allowedValues) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  return allowedValues.find((allowedValue) => allowedValue.toLowerCase() === normalizedValue) || String(value || '').trim();
}

function parseRoomId(value) {
  const roomId = Number(value);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    throw createRequestError('Room id is invalid.', 400);
  }

  return roomId;
}

function sortRoomNumbers(roomNumbers) {
  return roomNumbers.sort((left, right) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const leftIsNumeric = Number.isFinite(leftNumber);
    const rightIsNumeric = Number.isFinite(rightNumber);

    if (leftIsNumeric && rightIsNumeric) {
      return leftNumber - rightNumber;
    }

    if (leftIsNumeric) {
      return -1;
    }

    if (rightIsNumeric) {
      return 1;
    }

    return String(left).localeCompare(String(right), undefined, { numeric: true });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  const storedBuffer = Buffer.from(hash, 'hex');
  const derivedBuffer = Buffer.from(derivedKey, 'hex');

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

function createSessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

function serializeUser(user) {
  return {
    userId: user.user_id,
    fullName: user.full_name,
    email: user.email,
    contactNumber: user.contact_number,
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function serializeRoom(room) {
  return {
    roomId: room.room_id,
    roomNumber: room.room_number,
    roomType: room.room_type,
    status: room.status,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
  };
}

function createRequestError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function escapeSqlStringLiteral(value) {
  return String(value).replace(/'/g, "''");
}

function escapeSqlIdentifier(value) {
  return String(value).replace(/]/g, ']]');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function overrideConnectionStringDatabase(connectionString, databaseName) {
  const nextDatabaseName = String(databaseName).trim();

  if (!nextDatabaseName) {
    return connectionString;
  }

  if (/(^|;)\s*Database\s*=/i.test(connectionString)) {
    return connectionString.replace(/((?:^|;)\s*Database\s*=)\s*([^;]*)/i, `$1${nextDatabaseName}`);
  }

  if (/(^|;)\s*Initial Catalog\s*=/i.test(connectionString)) {
    return connectionString.replace(/((?:^|;)\s*Initial Catalog\s*=)\s*([^;]*)/i, `$1${nextDatabaseName}`);
  }

  return `${connectionString.replace(/;?\s*$/, '')};Database=${nextDatabaseName}`;
}

async function getSchemaDefinition() {
  try {
    if (!schemaDefinitionPromise) {
      schemaDefinitionPromise = loadSchemaDefinition();
    }

    return await schemaDefinitionPromise;
  } catch (error) {
    schemaDefinitionPromise = undefined;
    throw error;
  }
}

async function loadSchemaDefinition() {
  const rawScript = await fs.readFile(SCHEMA_FILE, 'utf8');

  if (!rawScript.trim()) {
    throw createRequestError('database/schema.sql is empty.', 500);
  }

  const schemaDatabaseName = parseSchemaDatabaseName(rawScript);
  const targetDatabaseName = String(process.env.DB_NAME || schemaDatabaseName).trim();
  const script = targetDatabaseName === schemaDatabaseName
    ? rawScript
    : replaceSchemaDatabaseName(rawScript, schemaDatabaseName, targetDatabaseName);
  const batches = splitSqlBatches(script);
  const useBatchIndex = batches.findIndex((batch) => /^\s*USE\b/i.test(batch));

  return {
    databaseName: targetDatabaseName,
    setupBatches: normalizeBatches(useBatchIndex === -1 ? batches : batches.slice(0, useBatchIndex)),
    applicationBatches: normalizeBatches(useBatchIndex === -1 ? [] : batches.slice(useBatchIndex + 1)),
  };
}

function parseSchemaDatabaseName(script) {
  const useMatch = script.match(/^\s*USE\s+(?:\[([^\]]+)\]|([A-Za-z0-9_]+))\s*;/im);
  const databaseName = useMatch?.[1] || useMatch?.[2];

  if (!databaseName) {
    throw createRequestError('database/schema.sql must include a USE <database>; statement.', 500);
  }

  return databaseName.trim();
}

function replaceSchemaDatabaseName(script, currentName, targetName) {
  const currentNamePattern = escapeRegex(currentName);

  return script
    .replace(
      new RegExp(`DB_ID\\('${escapeRegex(escapeSqlStringLiteral(currentName))}'\\)`, 'i'),
      `DB_ID('${escapeSqlStringLiteral(targetName)}')`,
    )
    .replace(
      new RegExp(`CREATE\\s+DATABASE\\s+(?:\\[${currentNamePattern}\\]|${currentNamePattern})`, 'i'),
      `CREATE DATABASE [${escapeSqlIdentifier(targetName)}]`,
    )
    .replace(
      new RegExp(`USE\\s+(?:\\[${currentNamePattern}\\]|${currentNamePattern})\\s*;`, 'i'),
      `USE [${escapeSqlIdentifier(targetName)}];`,
    );
}

function splitSqlBatches(script) {
  return script
    .split(/^\s*GO\s*$/im)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

function normalizeBatches(batches) {
  return batches.filter((batch) => batch && batch.trim() && !/^\s*USE\b/i.test(batch));
}

async function runSqlBatches(pool, batches) {
  for (const batch of batches) {
    await pool.request().query(batch);
  }
}

function getDatabaseConnectionHelp(error) {
  const baseMessage = getReadableErrorMessage(error);
  const serverTarget = String(process.env.DB_SERVER || '').trim();
  const localDbHint = serverTarget.toLowerCase().includes('(localdb)')
    ? [
        'This machine appears to be using SQL Server LocalDB.',
        'Use backend/.env with DB_AUTH_MODE=windows, DB_SERVER=(localdb)\\MSSQLLocalDB, and leave DB_INSTANCE blank.',
        'If LocalDB is stopped, run sqllocaldb start MSSQLLocalDB and restart the backend server.',
      ].join(' ')
    : [
        'This machine is using SQL Server Express with Windows Authentication.',
        'Use backend/.env with DB_AUTH_MODE=windows, DB_SERVER=localhost, and DB_INSTANCE=SQLEXPRESS.',
        'If it still fails, enable TCP/IP or Named Pipes for SQLEXPRESS in SQL Server Configuration Manager and restart the SQL Server service.',
      ].join(' ');

  return [
    'MSSQL connection failed.',
    baseMessage,
    localDbHint,
  ].join(' ');
}

function getReadableErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unknown database error.';
}

function handleApiError(error, res) {
  if (error && typeof error.statusCode === 'number') {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
  });
}

module.exports = { app, getStorage };