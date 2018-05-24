const path = require('path')
const crypto = require('crypto')
const randomString = require('randomstring').generate
const mime = require('mime-types')
const fileType = require('file-type')
const removeUndefined = require('../../util/removeUndefined')
const verifyPermissions = require('./actions/verifyPermissions')
const getAssetProps = require('./actions/getAssetProps')

module.exports = async (req, res, next) => {
  const requestId = randomString({length: 16})
  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {log, fileStore} = req.app.services
  const {label, title, description} = req.query
  const store = await dataStore.forDataset(dataset)

  // Verify that the session has access to create the document
  const doc = removeUndefined(
    Object.assign(
      {
        _type: `sanity.fileAsset`,
        label,
        title,
        description
      },
      getAssetMeta(req)
    )
  )

  try {
    log.trace('[%s] Verifying permissions to write file', requestId)
    await verifyPermissions(store, doc)
  } catch (error) {
    next(error)
    return
  }

  // Write the asset to its final location
  try {
    await fileStore.write(doc.path, req.body)
  } catch (error) {
    next(error instanceof Error ? error : new Error(error.message || error))
    return
  }

  // Write the asset document, exposing it to the world
  try {
    const trx = await store.newTransaction()
    await trx.createOrReplace(doc)
    await trx.close()
  } catch (error) {
    next(error)
    return
  }

  res.json({document: doc})
}

function getAssetMeta(req) {
  const size = req.body.length
  const metadata = fileType(req.body.slice(0, 5000)) || {}
  const sha1hash = crypto
    .createHash('sha1')
    .update(req.body)
    .digest('hex')

  let mimeType = resolveMimeType(req, metadata)
  const extension = resolveExtension(req, metadata, mimeType)

  if (mimeType === 'application/octet-stream') {
    mimeType = mime.lookup(extension) || mimeType
  }

  return getAssetProps({type: 'file', sha1hash, extension, req, mimeType, size})
}

function resolveMimeType(req, metadata) {
  // Resolve "best possible" metadata based on file content, hash and request headers
  return (req.headers['content-type'] || metadata.mime || 'application/octet-stream').replace(
    /(.*?);.*/,
    '$1'
  )
}

function resolveExtension(req, metadata, mimeType) {
  let extension = req.query.filename && path.extname(req.query.filename).replace(/^\./, '')
  if (!extension || extension === 'bin') {
    extension = metadata.ext || mime.extension(mimeType) || extension
  }

  return extension
}