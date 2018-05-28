const {omit} = require('lodash')
const uuid = require('uuid/v4')
const endOfStream = require('end-of-stream')

module.exports = async (req, res, next) => {
  res.writeHead(200, 'OK', {
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream'
  })

  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {query, includeResult, includePreviousRevision} = req.query
  const store = await dataStore.forDataset(dataset)
  const omitProps = [!includeResult && 'result', !includePreviousRevision && 'previous'].filter(
    Boolean
  )

  const onMutation = mut => writeEvent(res, omitProps.length > 0 ? omit(mut, omitProps) : mut)

  writeEvent(res, {listenerName: uuid()}, 'welcome')
  store.on('mutation', onMutation)
  endOfStream(res, () => store.removeListener('mutation', onMutation))
}

function writeEvent(res, data, event = 'mutation') {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
