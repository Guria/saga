const Boom = require('boom')
const extendBoom = require('../util/extendBoom')

module.exports = (err, req, res, next) => {
  const error = errorResponse(res, err)
  const log = req.app.services && req.app.services.log
  const code = (error.output && error.output.statusCode) || error.statusCode || error.code
  if (log && (!code || code >= 500)) {
    log.error(error)
  }
}

function wrapInBoom(err) {
  let error = err
  if (!err.isBoom) {
    error = Boom.boomify(err, {statusCode: err.statusCode || 500})
    error = err.payload ? extendBoom(error, err.payload) : error
  }

  return error
}

function errorResponse(res, err) {
  const error = wrapInBoom(err)
  const code = Number(err.code || err.statusCode || (error.output && error.output.statusCode))
  const statusCode = isNaN(code) ? 500 : code
  const headers = error.output.headers || {}

  if (!res.headersSent) {
    res
      .set(headers)
      .status(statusCode)
      .json(error.output.payload)
  }

  return error
}
