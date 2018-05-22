const Boom = require('boom')

module.exports = (err, req, res, next) => {
  const error = errorResponse(res, err)
  const log = req.app.services && req.app.services.log
  const code = (error.output && error.output.statusCode) || error.code
  if (log && (!code || code >= 500)) {
    log.error(error)
  }
}

function errorResponse(res, err) {
  let error = err
  if (!err.isBoom) {
    error = Boom.wrap(err)
  }

  const code = Number(err.code || (error.output && error.output.statusCode))
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
