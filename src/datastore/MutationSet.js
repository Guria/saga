const Patcher = require('@sanity/mutator').Patcher

module.exports = class MutationSet {
  constructor(mutations) {
    this.mutations = mutations
  }

  async execute(store) {
    const txn = store.newTransaction()
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
        case 'patch':
          const patch = new Patcher(body)
          await txn.update(body.id, attributes => {
            console.log('was:', JSON.stringify(attributes))
            const next = patch.apply(attributes)
            console.log('became:', JSON.stringify(next))
            return next
          })
          // await txn.update(body.id, (attributes) => patch.apply(attributes))
          break
        default:
          throw new Error(`Unknown operation type ${operation}`)
      }
    }
    return txn.close()
  }
}
