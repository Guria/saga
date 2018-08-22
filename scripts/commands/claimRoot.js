/* eslint-disable no-console */

import {claimRoot} from '../actions/claimRoot'
import {connect, ROOT_CLAIM_URL, ROOT_INVITE_URL} from '../config'

async function run() {
  await connect()
  await claimRoot({claimUrl: ROOT_CLAIM_URL, rootInviteUrl: ROOT_INVITE_URL})
}

run()
