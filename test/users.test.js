const request = require('supertest')
const config = require('../src/config')
const lyra = require('..')
const close = require('./helpers/close')

describe('users', () => {
  let app

  beforeAll(() => {
    app = lyra(config)
  })

  afterAll(() => {
    close()
  })

  test('can fetch current user', () =>
    request(app)
      .get('/v1/users/me')
      .expect(200, {
        id: 'pm6L9ZOzi',
        name: 'Tilde Nielsen',
        email: 'tilde@bengler.no',
        profileImage:
          'https://cdn.sanity.io/images/ppsg7ml5/test/a6a517d2ec48b2cdd98617214f60698d66d2ad52-869x917.png?w=320&h=320&fit=crop'
      }))
})
