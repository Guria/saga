/* eslint-disable no-console */
const fetch = require('node-fetch')
const open = require('opn')
const ora = require('ora')
import {prompt} from '../utils'

async function fetchRootInvite(rootInviteUrl) {
  return (await fetch(rootInviteUrl)).json()
}

async function waitForRootClaimed(rootInviteUrl) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const rootInvite = await fetchRootInvite(rootInviteUrl)
  if (!rootInvite.isAccepted) {
    await waitForRootClaimed(rootInviteUrl)
  }
}

export async function claimRoot({claimUrl, rootInviteUrl}) {
  const rootInvite = await fetchRootInvite(rootInviteUrl)
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

  const spinner = ora(`Log in from the browser at ${claimUrl}`).start()
  open(claimUrl)
  await waitForRootClaimed(rootInviteUrl)
  spinner.stop()
  console.log('✔ ︎Success')
}
