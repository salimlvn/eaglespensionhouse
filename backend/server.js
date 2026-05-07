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
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'schema.sql');
const ENABLE_FILE_STORAGE_FALLBACK = String(process.env.ENABLE_FILE_STORAGE_FALLBACK || 'false').toLowerCase() === 'true';
const USER_FIELD_LIMITS = Object.freeze({
  fullName: 120,
  email: 255,
  contactNumber: 30,
});
const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

let storagePromise;
let schemaDefinitionPromise;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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