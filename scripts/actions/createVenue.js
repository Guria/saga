import {createAllIfNotExists} from '../utils'

const tracks = require('../data/tracks')
const stages = require('../data/stages')
const deburr = require('lodash/deburr')
import {prompt} from '../utils'

const sluggedName = str =>
  deburr(str.toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9]/g, '')

export async function createVenue({dataStore}) {
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
  await createAllIfNotExists(store.newTransaction(), docs).commit()
  console.log(
    '✔ Venue %s created %s',
    venue.title,
    shouldCreateTracksAndStages ? 'with default tracks and stages' : ''
  )
}
