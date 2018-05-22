/* eslint-disable no-console, no-process-exit */
require('hard-rejection/register')

const server = require('./app')
const config = require('./config')

const app = server(config)

const httpServer = app.listen(config.port, config.hostname, () => {
  console.log(`Lyra running on http://${config.hostname}:${config.port}`)
})

process.on('SIGTERM', () => {
  console.log('\nCaught SIGTERM, exiting')
  httpServer.close(() => process.exit(143))
})
