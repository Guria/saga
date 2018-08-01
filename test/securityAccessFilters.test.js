const {close, getApp} = require('./helpers')
const determineAccessFilters = require('../src/security/determineAccessFilters')
const {
  noAccessFilterExpressions,
  fullAccessFilterExpressions
} = require('../src/security/defaultFilters')

describe('securityAccessFilters', () => {
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

  test('grants full access to venue administrator', async () => {
    const user = await createUser()
    await createDocument({
      name: 'journal-of-snah',
      _type: 'venue',
      administrators: [{_type: 'reference', _ref: user._id}]
    })
    const filters = await determineAccessFilters(user._id, await getScopedDataStore())
    expect(filters).toEqual(fullAccessFilterExpressions)
  })
})
