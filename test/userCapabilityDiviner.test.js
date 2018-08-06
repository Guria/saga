const {close, getApp} = require('./helpers')
const UserCapabilityDiviner = require('../src/security/UserCapabilityDiviner')

describe('userCapabilityDiviner', () => {
  const identityTemplate = {
    provider: 'google',
    providerId: 'xyzzy',
    name: 'Profeten Thomax',
    email: 'thomas@sanity.io'
  }

  let app
  let scopedDataStore

  async function getScopedDataStore() {
    if (!scopedDataStore) {
      scopedDataStore = await app.services.dataStore.forDataset('lyra-test')
    }
    return scopedDataStore
  }

  async function createUser() {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createUser(identity, 'lyra-test')
    return user
  }

  async function createDocument(doc) {
    const dataStore = await getScopedDataStore()
    const createdDocument = await dataStore
      .newTransaction({identity: '_system_'})
      .create(doc)
      .commit()
    return createdDocument
  }

  async function capabilitiesForUser(userId) {
    const ucd = new UserCapabilityDiviner(userId, app.services.dataStore, 'lyra-test')
    const capabilities = await ucd.runAll()
    return capabilities
  }

  beforeAll(() => {
    app = getApp()
  })

  beforeEach(() => {
    jest.setTimeout(15000)
  })

  afterAll(() => close(app))

  afterEach(() =>
    Promise.all(
      ['lyra-system-test', 'lyra-test'].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('recognizes an user unprivileged user', async () => {
    const unprivilegedUser = await createUser()
    await createDocument({
      _type: 'venue',
      name: 'journal-of-snah'
    })
    const capabilities = await capabilitiesForUser(unprivilegedUser._id)

    expect(capabilities).toMatchObject({
      isVenueAdministrator: false,
      isVenueCopyEditor: false,
      isVenueEditor: false
    })
  })

  test('recognizes venue bigwigs', async () => {
    const venueAdminUser = await createUser()
    const venueEditorUser = await createUser()
    const venueCopyEditorUser = await createUser()
    await createDocument({
      _type: 'venue',
      name: 'journal-of-snah',
      administrators: [{_type: 'reference', _ref: venueAdminUser._id}],
      editors: [{_type: 'reference', _ref: venueEditorUser._id}],
      copyEditors: [{_type: 'reference', _ref: venueCopyEditorUser._id}]
    })
    const caps = await capabilitiesForUser(venueAdminUser._id)
    expect(caps).toMatchObject({
      isVenueAdministrator: true,
      isVenueCopyEditor: false,
      isVenueEditor: false
    })

    const caps2 = await capabilitiesForUser(venueEditorUser._id)
    expect(caps2).toMatchObject({
      isVenueAdministrator: false,
      isVenueCopyEditor: false,
      isVenueEditor: true
    })

    const caps3 = await capabilitiesForUser(venueCopyEditorUser._id)
    expect(caps3).toMatchObject({
      isVenueAdministrator: false,
      isVenueCopyEditor: true,
      isVenueEditor: false
    })
  })

  test('recognizes article track editor', async () => {
    const articleTrackEditorUser = await createUser()

    const track = await createDocument({
      _id: 'TRACKID1234',
      _type: 'track',
      name: 'Bubblegum',
      editors: [{_type: 'reference', _ref: articleTrackEditorUser._id}]
    })

    await createDocument({
      _type: 'article',
      name: 'Bubblegum etc',
      track: [{_type: 'reference', _ref: track._id}]
    })

    const caps = await capabilitiesForUser(articleTrackEditorUser._id)
    expect(caps).toMatchObject({isEditorInArticleTrack: 'track._ref in ["TRACKID1234"]'})
  })
})
