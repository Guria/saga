/* eslint-disable no-console */
import {setup} from '../actions/setup'
import {
  ROOT_CLAIM_URL,
  ROOT_INVITE_URL,
  withFullAccessDataStore,
  connect,
  withUserStore
} from '../config'

async function run() {
  await connect()
  await withFullAccessDataStore(dataStore =>
    withUserStore(userStore =>
      setup({
        dataStore,
        userStore,
        rootInviteUrl: ROOT_INVITE_URL,
        claimUrl: ROOT_CLAIM_URL
      })
    )
  )
}
run().then(() => {
  console.log()
  console.log(`That's it. Goodbye 👋`)
})
