const mead = require('mead')
const getMeadConfig = require('mead/src/config')
const path = require('path')
const config = require('../../config')

const {adapter, options} = config.assets
const meadOptions = Object.assign({}, options, {
  basePath: path.join(options.basePath, 'images', 'vega')
})

module.exports = mead(
  getMeadConfig({
    sources: [
      {
        name: 'vega',
        adapter: {
          type: adapter,
          config: meadOptions
        }
      }
    ]
  })
)
