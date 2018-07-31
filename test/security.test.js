const {close, getApp} = require('./helpers')

describe('security', () => {
  const identityTemplate = {
    provider: 'google',
    providerId: 'xyzzy',
    name: 'Profeten Thomax',
    email: 'thomas@sanity.io'
  }

  const noAccessFilter = {
    create: 'false',
    read: 'false',
    update: 'false',
    delete: 'false'
  }

  const fullAccessFilter = {}

  let app
  let securityManager

  beforeAll(() => {
    app = getApp()
    securityManager = app.services.securityManager
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

  test('denies access to unknown user', async () => {
    const filters = await securityManager.getFilterExpressionsForUser('lyra-test', 'unknownUser')
    expect(filters).toEqual(noAccessFilter)
  })

  test('denies access if no user is given', async () => {
    const filters = await securityManager.getFilterExpressionsForUser('lyra-test')
    expect(filters).toEqual(noAccessFilter)
  })

  test('grants full access to system user', async () => {
    const filters = await securityManager.getFilterExpressionsForUser('lyra-test', '_system_')
    expect(filters).toEqual(fullAccessFilter)
  })

  test('grants full access to global admin user', async () => {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createAdminUser(identity)
    const filters = await securityManager.getFilterExpressionsForUser(null, user.identity)
    expect(filters).toEqual(fullAccessFilter)
  })

  test('grants full access to venue admin user', async () => {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createAdminUser(identity, 'lyra-test')
    const filters = await securityManager.getFilterExpressionsForUser('lyra-test', user.identity)
    expect(filters).toEqual(fullAccessFilter)
  })
})
