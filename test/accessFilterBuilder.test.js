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

  xtest('grants full access only to venue administrator', async () => {
    const venueAdminUser = await createUser()
    await createDocument({
      name: 'journal-of-snah',
      _type: 'venue',
      administrators: [{_type: 'reference', _ref: venueAdminUser._id}]
    })
    const filters = await filtersForUser(venueAdminUser._id)
    expect(filters).toEqual(fullAccessFilterExpressions)

    const unprivilegedUser = await createUser()
    const filters2 = await filtersForUser(unprivilegedUser._id)
    expect(filters2).toEqual(noAccessFilterExpressions)
  })
})
