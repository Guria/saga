/* eslint-disable no-await-in-loop */

const {Patcher} = require('@sanity/mutator')
const timeStampMutations = require('./timeStampMutations')

module.exports = class MutationSet {
  constructor(mutations) {
    this.mutations = mutations
  }

  async execute(store) {
    const txn = store.newTransaction()
    this.mutations = timeStampMutations(this.mutations, txn.time)
    for (let i = 0; i < this.mutations.length; i++) {
      const mutation = this.mutations[i]
      const operation = Object.keys(mutation)[0]
      const body = mutation[operation]
      switch (operation) {
        case 'create':
          await txn.create(body)
          break
        case 'createIfNotExists':
          // TODO: Ignore error if the document exists
          await txn.create(body)
          break
        case 'createOrReplace':
          await txn.createOrReplace(body)
          break
        case 'delete':
          await txn.delete(body.id)
          break
        case 'patch': {
          const patch = new Patcher(body)
          await txn.update(body.id, attributes => {
            const next = patch.apply(attributes)
            console.log("was:", attributes)
            console.log("became:", next)
            return next
          })
          break
        }
        default:
          throw new Error(`Unknown operation type ${operation}`)
      }
    }
    return txn.close()
  }
}
