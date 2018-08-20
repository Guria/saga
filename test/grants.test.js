const request = require('supertest')
const {close, createSession, getApp, getSessionCookie} = require('./helpers')
const getId = require('randomstring').generate

describe('grants', () => {
  const identityTemplate = {
    provider: 'google',
    providerId: 'xyzzy',
    name: 'Test User',
    email: 'test@example.com'
  }

  const dataset = 'saga-test'
  const systemDataset = 'saga-system-test'

  let app

  async function createUser() {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createUser(identity, 'saga-test')
    const sessionId = getId()
    await createSession(app, sessionId, identity._id)
    user.sessionId = sessionId
    return user
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
      [systemDataset, dataset].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('returns no grants for logged out user', async () => {
    const expected = {
      read: {node: 'bool', pos: 0, value: false},
      update: {node: 'bool', pos: 0, value: false},
      delete: {node: 'bool', pos: 0, value: false},
      create: {node: 'bool', pos: 0, value: false}
    }
    await request(app)
      .get(`/v1/grants/${dataset}`)
      .expect(200, expected)
  })

  test('returns grants for logged in user', async () => {
    const user = await createUser()

    await request(app)
      .get(`/v1/grants/${dataset}`)
      .set('Cookie', getSessionCookie(app, user))
      .expect(200)
      .expect(result => {
        const userGrants = result.body
        expect(userGrants.read).toBeTruthy()
        expect(userGrants.create).toBeTruthy()
        expect(userGrants.update).toBeTruthy()
        expect(userGrants.delete).toBeTruthy()
        expect(userGrants.capabilities).toBeTruthy()
      })
  })
})
