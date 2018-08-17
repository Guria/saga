/* eslint-disable no-console */
const StoreManager = require('../src/datastore/StoreManager')
const {fullAccessFilterExpressions} = require('../src/security/defaultFilters')
const config = require('../src/config')
const url = require('url')
const deburr = require('lodash/deburr')
const tracks = require('./bootstrap/tracks')
const stages = require('./bootstrap/stages')
const inquirer = require('inquirer')
const fetch = require('node-fetch')
const open = require('opn')
const ora = require('ora')

const SERVER_URL = url.format({
  protocol: 'http',
  hostname: config.hostname,
  port: config.port
})
const CLAIM_URL = url.format({
  protocol: 'http',
  hostname: config.hostname,
  port: config.port,
  pathname: `/v1/invitations/root/login`
})
const ROOT_INVITE_URL = url.format({
  protocol: 'http',
  hostname: config.hostname,
  port: config.port,
  pathname: `/v1/invitations/root`
})

function prompt(questions) {
  return inquirer.prompt(questions)
}

prompt.Separator = inquirer.Separator
prompt.single = question => prompt([{...question, name: 'value'}]).then(answers => answers.value)

const dataStore = new StoreManager(config.datastore)
dataStore.setSecurityManager({
  getFilterExpressionsForUser: () => Promise.resolve(fullAccessFilterExpressions)
})

const sluggedName = str =>
  deburr(str.toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9]/g, '')

function createAllIfNotExists(transaction, docs) {
  return docs.reduce((trx, doc) => trx.createIfNotExists(doc), transaction)
}

async function fetchRootInvite() {
  return (await fetch(ROOT_INVITE_URL)).json()
}

async function connect() {
  try {
    await fetch(SERVER_URL)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      await prompt.single({
        message:
          'The Saga server does not seem to be running. Please start it with `npm start` and press enter to continue.',
        type: 'input',
        prefix: '✋'
      })
      await connect()
      return
    }
    throw err
  }
}

async function waitForRootClaimed() {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const rootInvite = await fetchRootInvite()
  if (!rootInvite.isAccepted) {
    await waitForRootClaimed()
  }
}
async function createRootUser() {
  const rootInvite = await fetchRootInvite()
  if (rootInvite.isAccepted) {
    console.log('✔ Root user already exists')
    console.log('')
    return
  }
  const doCreate = await prompt.single({
    message: 'No root user found. Would you like to become the root user now?',
    type: 'confirm'
  })
  if (!doCreate) {
    return
  }

  const spinner = ora(`Log in from the browser at ${CLAIM_URL}`).start()
  open(CLAIM_URL)
  await waitForRootClaimed()
  spinner.stop()
  console.log('✔ ︎Success')
}

async function createVenue() {
  const venueName = await prompt.single({
    message: 'Display name:',
    type: 'input'
  })
  const datasetName = await prompt.single({
    message: `Name of dataset for venue "${venueName}":`,
    type: 'input',
    default: sluggedName(venueName)
  })

  const venue = {
    _id: datasetName,
    _type: 'venue',
    title: venueName
  }

  const shouldCreateTracksAndStages = await prompt.single({
    message: 'Do you want to add a default set of tracks and stages?',
    type: 'confirm'
  })

  const docs = [venue, ...(shouldCreateTracksAndStages ? [...tracks, ...stages] : [])]
  const store = await dataStore.forDataset(datasetName)
  return createAllIfNotExists(store.newTransaction(), docs).commit()
}

async function run() {
  await connect()
  await createRootUser()

  const shouldCreateVenue = await prompt.single({
    message: 'Would you like to create a new venue?',
    type: 'confirm'
  })
  if (shouldCreateVenue) {
    const venues = await createVenue()
    console.log(venues)
  }
  dataStore.disconnect()
}

run().then(() => {
  console.log()
  console.log(`That's it. Goodbye 👋`)
})
