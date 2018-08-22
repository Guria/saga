/* eslint-disable no-console */
import {prompt} from '../utils'
import {createVenue} from './createVenue'
import {claimRoot} from './claimRoot'

export async function setup({dataStore, userStore, rootInviteUrl, claimUrl}) {
  await claimRoot({claimUrl, rootInviteUrl})

  const shouldCreateVenue = await prompt.single({
    message: 'Would you like to create a new venue?',
    type: 'confirm'
  })
  if (shouldCreateVenue) {
    await createVenue({dataStore, userStore})
  }
}
