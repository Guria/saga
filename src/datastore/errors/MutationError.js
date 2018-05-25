const LyraError = require('../../errors/LyraError')

class MutationError extends LyraError {
  constructor(options = {}) {
    const description = options.description || 'An unknown error occured'
    super(description, options)
    this.payload = options
  }
}

module.exports = MutationError
