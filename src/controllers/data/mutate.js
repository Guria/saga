module.exports = (req, res, next) => {
  res.json({
    transactionId: `moop-${Math.random()
      .toString()
      .slice(2)}`,
    results: [{id: 'foo', operation: 'update'}]
  })
}
