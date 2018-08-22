/* eslint-disable no-console */
import {connect, withFullAccessDataStore, withUserStore} from '../config'
import {createVenue} from '../actions/createVenue'

async function run() {
  await connect()
  await withFullAccessDataStore(dataStore =>
    withUserStore(userStore => createVenue({dataStore, userStore}))
  )
}

run()
