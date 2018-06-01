const {omit} = require('lodash')
const uuid = require('uuid/v4')
const endOfStream = require('end-of-stream')
const SseChannel = require('sse-channel')

module.exports = async (req, res, next) => {
  let messageIndex = 0
  const getMessageId = () => ++messageIndex + Date.now()

  const channel = new SseChannel({
    historySize: 250,
    jsonEncode: true
  })

  channel.addClient(req, res)

  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {query, includeResult, includePreviousRevision} = req.query
  const store = await dataStore.forDataset(dataset)
  const omitProps = [!includeResult && 'result', !includePreviousRevision && 'previous'].filter(
    Boolean
  )

  const onMutation = mut =>
    channel.send({
      id: getMessageId(),
      event: 'mutation',
      data: omitProps.length > 0 ? omit(mut, omitProps) : mut
    })

  channel.send({id: getMessageId(), data: {listenerName: uuid()}, event: 'welcome'})
  store.on('mutation', onMutation)
  endOfStream(res, () => {
    store.removeListener('mutation', onMutation)
    channel.close()
  })
}
