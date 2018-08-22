/* eslint-disable no-console */
import {setup} from '../actions/setup'
import {ROOT_CLAIM_URL, ROOT_INVITE_URL, withFullAccessDataStore, connect} from '../config'

async function run() {
  await connect()
  await withFullAccessDataStore(dataStore =>
    setup({
      dataStore,
      rootInviteUrl: ROOT_INVITE_URL,
      claimUrl: ROOT_CLAIM_URL
    })
  )
}
run().then(() => {
  console.log()
  console.log(`That's it. Goodbye 👋`)
})
