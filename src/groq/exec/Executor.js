const Scope = require('./Scope')

module.exports = class Executor {

  constructor(options) {
    const {
      operations,
      scope,
      fetcher
    } = options
    this.scope = scope || new Scope({
      parent: null,
      value: {}
    })
    this.fetch = fetcher
    this.operations = operations
  }

  run() {
    return this.exec(this.operations, this.scope)
  }

  async exec(operation, scope) {
    console.log(operation, scope)
    switch (operation.op) {
      case 'everything':
        // Make a fake no-op filter to execute a naked everything
        return this.execFilter({
          op: 'filter',
          source: operation,
          filter: null
        })
      case 'filter':
        return this.execFilter(operation, scope)
      case 'and':
        return this.execAnd(operation, scope)
      case 'eq':
        return this.execEq(operation, scope)
      case 'accessor':
        return this.execAccessor(operation, scope)
      case 'literal':
        return this.execLiteral(operation, scope)
      default:
        throw `(exec) Unknown operation ${operation.op}`
    }
  }

  async execAnd(operation, scope) {
    const lhs = await this.exec(operation.lhs, scope)
    const rhs = await this.exec(operation.rhs, scope)
    return new Scope({
      parent: scope.parent,
      value: !!(lhs.value && rhs.value)
    })
  }

  async execEq(operation, scope) {
    const lhs = await this.exec(operation.lhs, scope)
    const rhs = await this.exec(operation.rhs, scope)
    return new Scope({
      parent: scope.parent,
      value: lhs.value == rhs.value
    })
  }

  async execAccessor(operation, scope) {
    return scope.resolveAccessor(operation.path)
  }

  async execLiteral(operation, scope) {
    return new Scope({
      parent: null,
      value: operation.value
    })
  }

  async execFilter(operation, scope) {
    // Is this a fetch operation?
    let source
    if (operation.source.op == 'everything') {
      const documents = await this.fetch(operation.filter)
      source = new Scope({parent: scope, value: documents})
    } else {
      source = await exec(operation.source, scope)
    }
    // Extract values. Might be an array or a single value.
    const items = Array.isArray(source.value) ? source.value : [source.value]

    console.log("fetched:", items)

    // Run the filter on every item
    const result = []
    for(let i = 0; i < items.length; i++) {
      const item = new Scope({parent: source.parent, value: items[i]})
      const filterValue = operation.filter ? await this.exec(operation.filter, item) : new Scope({value: true})
      if (filterValue.value) {
        result.push(item.value)
      }
    }
    console.log("filter result:", result)
    return new Scope({parent: scope, value: result})
  }
}

