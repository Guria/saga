/* eslint-disable no-console */
const StoreManager = require('../src/datastore/StoreManager')
const {fullAccessFilterExpressions} = require('../src/security/defaultFilters')
const config = require('../src/config')
const url = require('url')
const deburr = require('lodash/deburr')
const inquirer = require('inquirer')
import open from 'opn'

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

async function createVenue(datasetName, venue) {
  const store = await dataStore.forDataset(datasetName)
  const result = await store
    .newTransaction()
    .createOrReplace(venue)
    .commit()
  return result.results[0].document
}

async function run() {
  const claimUrl = url.format({
    protocol: 'http',
    hostname: config.hostname,
    port: config.port,
    pathname: `/v1/invitations/root`
  })
  const createDefaultVenue = await prompt.single({
    message: 'Would you like to create a default venue?',
    type: 'confirm'
  })
  if (createDefaultVenue) {
    const venueName = await prompt.single({
      message: 'Venue display name:',
      type: 'input'
    })
    const datasetName = await prompt.single({
      message: 'Name of dataset',
      type: 'input',
      default: sluggedName(venueName)
    })
    const createdVenue = await createVenue(datasetName, {
      _id: 'venue',
      _type: 'venue',
      title: venueName
    })
    console.log('Success! Created venue %s', createdVenue.title)
  }
  const createRootUser = await prompt.single({
    message: [
      `To claim the root user, you will have to navigate to ${claimUrl}`,
      'Note: the Saga backend must be running while logging on.',
      'Would you like to create a root user now?'
    ].join('\n'),
    type: 'confirm'
  })

  if (createRootUser) {
    open(claimUrl, {wait: false})
  }

  console.log()
  console.log(`That's it. Goodbye 👋`)
  dataStore.disconnect()
}

run()
