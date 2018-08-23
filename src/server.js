/* eslint-disable no-console, no-process-exit */
require('hard-rejection/register')

const app = require('./app')
const defaultConfig = require('./config')
const wsServer = require('./wsServer')
const commander = require('commander')
const fs = require('fs')

commander
  .version('0.1.0')
  .option('-c, --config [path]', 'Path to config file')
  .parse(process.argv);


let config = defaultConfig

if (commander.config) {
  console.log("Reading config from ", commander.config)
  const optionalConfig = JSON.parse(fs.readFileSync(commander.config).toString())
  config = Object.assign(config, optionalConfig)
}

if (config.env === 'production' && config.session.secret === config.DEV_SESSION_SECRET) {
  throw new Error('Cannot use default session secret in production')
}

const server = app(config)

const httpServer = server.listen(config.port, config.hostname, () => {
  console.log(`Saga running on http://${config.hostname}:${config.port}`)
})

wsServer({
  app: server,
  wsOptions: {
    server: httpServer
  }
})

process.on('SIGTERM', () => {
  console.log('\nCaught SIGTERM, exiting')
  httpServer.close(() => process.exit(143))
})
