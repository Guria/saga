/* eslint-disable no-process-env */
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
    maxInputBytes: parseInt(process.env.LYRA_ASSETS_MAX_INPUT_BYTES || FIFTEEN_MEGABYTES, 10)
  }
}
