/* eslint-disable no-process-env */
const path = require('path')

const ONE_MEGABYTE = 1024 * 1024
const TWO_MEGABYTES = ONE_MEGABYTE * 2
const FIFTEEN_MEGABYTES = ONE_MEGABYTE * 15

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.LYRA_HTTP_PORT || 4000,
  hostname: process.env.LYRA_HTTP_HOST || '127.0.0.1',
  logLevel: process.env.LYRA_LOG_LEVEL || 'info',

  data: {
    maxInputBytes: parseInt(process.env.LYRA_DATA_MAX_INPUT_BYTES || TWO_MEGABYTES, 10)
  },

  assets: {
    baseUrl: 'http://localhost:4000',
    maxInputBytes: parseInt(process.env.LYRA_ASSETS_MAX_INPUT_BYTES || FIFTEEN_MEGABYTES, 10),
    adapter: 'fs',
    options: {
      basePath: process.env.LYRA_ASSETS_FS_BASE_PATH || path.join(__dirname, '..', 'data', 'assets')
    }
  },

  cors: {
    credentials: true,
    maxAge: parseInt(process.env.LYRA_CORS_MAX_AGE || 600, 10),
    origin: split(process.env.LYRA_CORS_ORIGINS) || [
      'http://localhost:3333',
      'http://localhost:1234',
      'http://127.0.0.1:1234',
      'http://0.0.0.0:1234'
    ],
    exposedHeaders: ['Content-Type', 'Content-Length', 'ETag']
      .concat(split(process.env.LYRA_CORS_EXPOSED_HEADERS))
      .filter(Boolean)
  },

  datastore: {
    url: process.env.LYRA_MONGODB_URL || 'mongodb://localhost:27017'
  }
}

function split(val, by = ',') {
  if (!val) {
    return undefined
  }

  return val.split(by)
}
