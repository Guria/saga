module.exports = (req, res, next) => {
  const {id, identity} = req.user || {}
  const {name, email, profileImage} = identity || {}
  res.json({id, name, email, profileImage})
}
