const request = require('supertest')
const uuid = require('uuid/v4')
const lyra = require('..')
const {close, getConfig} = require('./helpers')

describe('mutations', () => {
  let app

  beforeAll(() => {
    app = lyra(getConfig())
  })

  afterAll(() => {
    close(app)
  })

  test('can create and fetch document', async () => {
    const doc = {_id: 'foo', _type: 'test', random: uuid()}
    const transactionId = uuid()
    await request(app)
      .post('/v1/data/mutate/lyraTest')
      .send({mutations: [{createOrReplace: doc}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'create'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyraTest/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject(doc)
      })
  })
})
