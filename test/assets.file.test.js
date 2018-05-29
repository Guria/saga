const qs = require('querystring')
const request = require('supertest')
const fs = require('fs')
const path = require('path')
const {close, getApp, getAuthHeader} = require('./helpers')

const getDocument = (app, id) => {
  return request(app)
    .get(`/v1/data/doc/lyra-test/${id}`)
    .expect(200)
    .then(res => res.body.documents[0])
}

// @todo
const getPermissionError = () => {}

describe('asset file uploads', () => {
  let app

  beforeAll(() => {
    app = getApp()
  })

  afterAll(async () => {
    await close(app)
  })

  test('rejects url-encoded requests', () =>
    request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('moo')
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'child "content-type" fails because ["content-type" contains an invalid value]',
        validation: {source: 'headers', keys: ['content-type']}
      }))

  test('rejects form-data requests', () =>
    request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('moo')
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'child "content-type" fails because ["content-type" contains an invalid value]',
        validation: {source: 'headers', keys: ['content-type']}
      }))

  test('rejects invalid dataset names', () =>
    request(app)
      .post('/v1/assets/files/my%20dataset')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'image/jpeg')
      .send('moo')
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'child "dataset" fails because ["dataset" with',
          'value "my dataset" fails to match the dataset name pattern]'
        ].join(' '),
        validation: {source: 'params', keys: ['dataset']}
      }))

  test('rejects invalid labels', () => {
    const label = new Array(70).join('label')
    return request(app)
      .post(`/v1/assets/files/lyra-test?label=${label}`)
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'image/jpeg')
      .send('moo')
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'child "label" fails because ["label" length',
          'must be less than or equal to 300 characters long]'
        ].join(' '),
        validation: {source: 'query', keys: ['label']}
      })
  })

  test('rejects invalid filenames', () => {
    const filename = new Array(70).join('filename')
    return request(app)
      .post(`/v1/assets/files/lyra-test?filename=${filename}`)
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'image/jpeg')
      .send('moo')
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'child "filename" fails because ["filename" length',
          'must be less than or equal to 300 characters long]'
        ].join(' '),
        validation: {source: 'query', keys: ['filename']}
      })
  })

  test.skip('rejects with 404 on missing dataset', () => {
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'image/jpeg')
      .send('moo')
      .expect(404)
  })

  test.skip('rejects with 400 on insufficient permissions', () => {
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'text/plain')
      .send('moo')
      .expect(400, getPermissionError('create'))
  })

  test('uploads files', () => {
    expect.assertions(4)
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'text/plain')
      .send('moop')
      .expect(200)
      .then(async res => {
        expect(res.body).toHaveProperty('document')
        expect(res.body.document).toHaveProperty('_id')

        const file = await app.services.fileStore.read(res.body.document.path)
        expect(Buffer.from('moop')).toEqual(file)

        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _id: 'file-47ba17d63618b876d5002b0f110671211ea0214c-txt',
          _type: 'sanity.fileAsset',
          assetId: '47ba17d63618b876d5002b0f110671211ea0214c',
          sha1hash: '47ba17d63618b876d5002b0f110671211ea0214c',
          path: 'files/vega/lyra-test/47ba17d63618b876d5002b0f110671211ea0214c.txt',
          url:
            'http://localhost:4000/files/vega/lyra-test/47ba17d63618b876d5002b0f110671211ea0214c.txt',
          originalFilename: '47ba17d63618b876d5002b0f110671211ea0214c.txt',
          extension: 'txt',
          mimeType: 'text/plain',
          size: 4
        })
      })
  })

  test('uploads files with specific origin filename', () => {
    const filename = 'blåbærsyltetøy på skiva.csv'
    return request(app)
      .post(`/v1/assets/files/lyra-test?filename=${encodeURIComponent(filename)}`)
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'text/csv')
      .send('2017-06-03,5,30\n')
      .expect(200)
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _id: 'file-e5145b41219ffc51dffc9f2de8b522c51c3d38d3-csv',
          _type: 'sanity.fileAsset',
          assetId: 'e5145b41219ffc51dffc9f2de8b522c51c3d38d3',
          extension: 'csv',
          mimeType: 'text/csv',
          originalFilename: 'blåbærsyltetøy på skiva.csv',
          path: 'files/vega/lyra-test/e5145b41219ffc51dffc9f2de8b522c51c3d38d3.csv',
          sha1hash: 'e5145b41219ffc51dffc9f2de8b522c51c3d38d3',
          size: 16
        })
      })
  })

  test('uploads files with title, description, label, filename', () => {
    const meta = {
      label: 'l4b3l',
      title: 'Blueberry jam',
      description: 'Spreadsheet of pros and cons related to blueberry jam',
      filename: 'blåbærsyltetøy på skiva.csv'
    }

    return request(app)
      .post(`/v1/assets/files/lyra-test?${qs.stringify(meta)}`)
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'text/csv')
      .send('2017-06-03,5,30\n')
      .expect(200)
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'csv',
          mimeType: 'text/csv',
          originalFilename: meta.filename,
          label: meta.label,
          description: meta.description
        })
      })
  })

  test('uploads files with no content-type as octet-stream', () => {
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .send(Buffer.from('mix'))
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'bin',
          size: 3,
          mimeType: 'application/octet-stream'
        })
      })
  })

  test('uploads files and uses filename extension as fallback, infers mime', () => {
    const filename = 'foobar.txt'
    return request(app)
      .post(`/v1/assets/files/lyra-test?filename=${encodeURIComponent(filename)}`)
      .set('Authorization', getAuthHeader())
      .send(Buffer.from('mix'))
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'txt',
          size: 3,
          mimeType: 'text/plain'
        })
      })
  })

  test('uploads files and infers extension from client-sent mime type', () => {
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Content-Type', 'application/javascript')
      .set('Authorization', getAuthHeader())
      .send(Buffer.from('console.log("foo")'))
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'js',
          size: 18,
          mimeType: 'application/javascript'
        })
      })
  })

  test('uploads files and infers extension and mime type where possible', () => {
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Content-Type', 'application/octet-stream')
      .set('Authorization', getAuthHeader())
      .send(fs.readFileSync(path.join(__dirname, 'fixtures', 'some.zip')))
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'zip',
          size: 168,
          mimeType: 'application/zip'
        })
      })
  })

  test('uploads files and infers extension and mime type (no content type provided)', () => {
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .send(fs.readFileSync(path.join(__dirname, 'fixtures', 'some.zip')))
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'zip',
          size: 168,
          mimeType: 'application/zip'
        })
      })
  })

  test('calculates correct sha1 hash for large(ish) files', () => {
    const data = '!foobar!'.repeat(655360) // 5 MB
    return request(app)
      .post('/v1/assets/files/lyra-test')
      .set('Authorization', getAuthHeader())
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(data)
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})
        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          size: 8 * 655360,
          mimeType: 'text/plain'
        })
      })
  })

  test('uploads files and tries to infer correct mime/extension if original extension is `bin`', () => {
    const filename = 'some.bin'
    return request(app)
      .post(`/v1/assets/files/lyra-test?filename=${encodeURIComponent(filename)}`)
      .set('Authorization', getAuthHeader())
      .send(fs.readFileSync(path.join(__dirname, 'fixtures', 'some.zip')))
      .then(async res => {
        expect(res.body.document).toMatchObject({_type: 'sanity.fileAsset'})

        const doc = await getDocument(app, res.body.document._id)
        expect(doc).toMatchObject({
          _type: 'sanity.fileAsset',
          extension: 'zip',
          size: 168,
          mimeType: 'application/zip'
        })
      })
  })
})