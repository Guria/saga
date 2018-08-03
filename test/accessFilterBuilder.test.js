const {close, getApp} = require('./helpers')
const AccessFilterBuilder = require('../src/security/AccessFilterBuilder')

const {
  noAccessFilterExpressions,
  fullAccessFilterExpressions
} = require('../src/security/defaultFilters')

describe('accessFilterBuilder', () => {
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

  async function filtersForUser(userId) {
    const filterBuilder = new AccessFilterBuilder(userId, app.services.dataStore, 'lyra-test')
    const filters = await filterBuilder.determineFilters()
    return filters
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

  test('grants full read access only to venue bigwigs', async () => {
    const venueAdminUser = await createUser()
    const venueEditorUser = await createUser()
    const venueCopyEditorUser = await createUser()
    const unprivilegedUser = await createUser()
    await createDocument({
      name: 'journal-of-snah',
      _type: 'venue',
      administrators: [{_type: 'reference', _ref: venueAdminUser._id}],
      editors: [{_type: 'reference', _ref: venueEditorUser._id}],
      copyEditors: [{_type: 'reference', _ref: venueCopyEditorUser._id}]
    })
    const filters = await filtersForUser(venueAdminUser._id)
    expect(filters.read).toMatch(/_type == "article" && \(true \|\| false \|\| false\)/)

    const filters2 = await filtersForUser(venueEditorUser._id)
    expect(filters2.read).toMatch(/_type == "article" && \(false \|\| true \|\| false\)/)

    const filters3 = await filtersForUser(venueCopyEditorUser._id)
    expect(filters3.read).toMatch(/_type == "article" && \(false \|\| false \|\| true\)/)

    const filters4 = await filtersForUser(unprivilegedUser._id)
    expect(filters4.read).toMatch(/_type == "article" && \(false \|\| false \|\| false\)/)
  })
})
