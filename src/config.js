/* eslint-disable no-process-env */
const path = require('path')

const ONE_MEGABYTE = 1024 * 1024
const TWO_MEGABYTES = ONE_MEGABYTE * 2
const FIFTEEN_MEGABYTES = ONE_MEGABYTE * 15
const DEV_SESSION_SECRET = 'LyraDevForGreatJustice'
const DEFAULT_AUTH_PROVIDER_CONFIG_PATH = path.join(__dirname, '..', 'config', 'oauth.json')
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

const env = process.env.NODE_ENV || 'development'

module.exports = {
  env,
  port: process.env.LYRA_HTTP_PORT || 4000,
  hostname: process.env.LYRA_HTTP_HOST || '127.0.0.1',
  logLevel: process.env.LYRA_LOG_LEVEL || 'info',

  session: {
    name: process.env.LYRA_SESSION_NAME || 'lyraSession',
    resave: true,
    rolling: true,
    saveUninitialized: false,
    secret: process.env.LYRA_SESSION_SECRET || DEV_SESSION_SECRET,
    cookie: {
      secure: env === 'production' || env === 'staging',
      maxAge: int(process.env.LYRA_SESSION_TTL_MS, THIRTY_DAYS)
    }
  },

  sessionStore: {
    touchAfter: 6 * 3600 // Only touch sessions once every 6 hours
  },

  auth: {
    providersConfigPath:
      process.env.LYRA_AUTH_PROVIDERS_CONFIG_PATH || DEFAULT_AUTH_PROVIDER_CONFIG_PATH
  },

  data: {
    maxInputBytes: int(process.env.LYRA_DATA_MAX_INPUT_BYTES, TWO_MEGABYTES)
  },

  assets: {
    baseUrl: 'http://localhost:4000',
    maxInputBytes: int(process.env.LYRA_ASSETS_MAX_INPUT_BYTES, FIFTEEN_MEGABYTES),
    adapter: 'fs',
    options: {
      basePath: process.env.LYRA_ASSETS_FS_BASE_PATH || path.join(__dirname, '..', 'data', 'assets')
    }
  },

  cors: {
    credentials: true,
    maxAge: int(process.env.LYRA_CORS_MAX_AGE, 600),
    origin: split(process.env.LYRA_CORS_ORIGINS) || [
      'http://localhost:3333',
      'http://127.0.0.1:3333',
      'http://0.0.0.0:3333',
      'http://localhost:1234',
      'http://127.0.0.1:1234',
      'http://0.0.0.0:1234',
      'http://localhost:1235',
      'http://127.0.0.1:1235',
      'http://0.0.0.0:1235',
    ],
    exposedHeaders: ['Content-Type', 'Content-Length', 'ETag']
      .concat(split(process.env.LYRA_CORS_EXPOSED_HEADERS))
      .filter(Boolean)
  },

  datastore: {
    adapter: 'MongoDB',
    url: process.env.LYRA_MONGODB_URL || 'mongodb://localhost:27017',
    options: {
      dbPrefix: 'lyra',
      collection: 'documents',
      systemDb: env === 'test' ? 'lyra-system-test' : 'lyra-system'
    }
  },

  DEV_SESSION_SECRET,
  DEFAULT_AUTH_PROVIDER_CONFIG_PATH
}

function split(val, by = ',') {
  if (!val) {
    return undefined
  }

  return val.split(by)
}

function int(num, defaultVal) {
  return typeof num === 'undefined' ? defaultVal : parseInt(num, 10)
}
