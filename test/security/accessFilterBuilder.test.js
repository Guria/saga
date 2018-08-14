const {close, getApp} = require('../helpers')
const AccessFilterBuilder = require('../../src/security/AccessFilterBuilder')

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
      scopedDataStore = await app.services.dataStore.forDataset('saga-test')
    }
    return scopedDataStore
  }

  async function createUser() {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createUser(identity, 'saga-test')
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
    const filterBuilder = new AccessFilterBuilder(userId, app.services.dataStore, 'saga-test')
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
      ['saga-system-test', 'saga-test'].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  // This test will eventually evaluate a single mega-pile of filters
  test('sparse read access to unprivileged user', async () => {
    const unprivilegedUser = await createUser()
    await createDocument({
      _type: 'venue',
      name: 'journal-of-snah'
    })
    const filters = await filtersForUser(unprivilegedUser._id)
    expect(filters).toBeTruthy()
    const expected = `((_type == "venue") || (_type == "issue") || (_type == "track") || (_type == "stage") || (_type == "user") || (_type == "article" && (false)) || (_type == "comment" && ((author._ref == "${
      unprivilegedUser._id
    }") || (false))) || (_type == "reviewProcess" && (false)) || (_type == "reviewItem" && ((false) || (reviewer._ref == "${
      unprivilegedUser._id
    }"))) || (_type == "featureConfig") || (_type == "featureState" && (false)))`
    expect(filters.read).toEqual(expected)
  })

  test('grants update on comment for comment author', async () => {
    const author = await createUser()

    await createDocument({
      _type: 'comment',
      title: 'Stuff I chew on',
      author: {_type: 'reference', _ref: author._id}
    })
    const filters = await filtersForUser(author._id)

    const expected = `((_type == "venue" && (false)) || (_type == "issue" && (false)) || (_type == "track" && (false)) || (_type == "stage" && (false)) || (_type == "user" && (false)) || (_type == "article" && (false)) || (_type == "comment" && ((author._ref == "${
      author._id
    }") || (false))) || (_type == "reviewProcess" && (false)) || (_type == "reviewItem" && ((false) || (reviewer._ref == "${
      author._id
    }"))) || (_type == "featureConfig" && (false)) || (_type == "featureState" && (false)))`
    expect(filters.update).toEqual(expected)
  })
})
