const {close, getApp} = require('./helpers')

describe('query', () => {
  const identity = {
    provider: 'google',
    providerId: 'uid123',
    name: 'Espen',
    email: 'espen@sanity.io'
  }

  let app

  beforeAll(() => {
    app = getApp()
  })

  afterAll(() => {
    close(app)
  })

  afterEach(() =>
    Promise.all(
      ['_vega_system_', 'lyra-test'].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('can create and fetch identity', async () => {
    const userStore = app.services.userStore
    await userStore.createIdentity(identity)
    const result = await userStore.fetchIdentity('google', 'uid123')
    expect(result).toMatchObject(identity)
    expect(result).toHaveProperty('_id')
  })

  test('can claim global user and fetch user for identity', async () => {
    const userStore = app.services.userStore
    const ident = await userStore.createIdentity(identity)
    expect(ident).toMatchObject(identity)

    const stub = await userStore.createAdminUserStub()
    expect(stub).toMatchObject({isAdmin: true})

    const claimed = await userStore.claimUser(stub._id, ident._id, null, {name: 'Espen', arb: 'i'})
    expect(claimed).toMatchObject({isAdmin: true, identityId: ident._id, name: 'Espen'})
    expect(claimed).not.toHaveProperty('arb')

    const users = await userStore.fetchUsersForIdentity(ident._id)
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject(claimed)
  })

  test('can claim journal user and fetch user for identity', async () => {
    const userStore = app.services.userStore
    const ident = await userStore.createIdentity(identity)
    expect(ident).toMatchObject(identity)

    const stub = await userStore.createAdminUserStub('lyra-test')
    expect(stub).toMatchObject({isAdmin: true})

    const claimed = await userStore.claimUser(stub._id, ident._id, 'lyra-test', {
      name: 'Espen',
      arb: 'i'
    })
    expect(claimed).toMatchObject({isAdmin: true, identityId: ident._id, name: 'Espen'})
    expect(claimed).not.toHaveProperty('arb')

    const users = await userStore.fetchUsersForIdentity(ident._id, 'lyra-test')
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject(claimed)
  })
})
