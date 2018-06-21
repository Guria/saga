const signature = require('cookie-signature')

const enc = encodeURIComponent

module.exports = (app, user) => {
  const {secret, name} = app.services.config.session
  const signed = `s:${signature.sign(user.sessionId, secret)}`
  return `${enc(name)}=${enc(signed)}`
}
