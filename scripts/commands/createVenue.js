/* eslint-disable no-console */
import {connect, withFullAccessDataStore} from '../config'
import {createVenue} from '../actions/createVenue'

/* eslint-disable no-console */

async function run() {
  await connect()
  await withFullAccessDataStore(dataStore =>
    createVenue({
      dataStore
    })
  )
}

run()
