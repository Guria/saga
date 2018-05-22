module.exports = class Scope {
  constructor(options) {
    const {value, parent} = options
    this.value = value
    this.parent = parent
  }

  clone() {
    return new Scope({parent: this.parent, value: this.value})
  }

  resolveAccessor(path) {
    let scope = this
    for(let i = 0; i < path.length; i++) {
      const operation = path[i]
      switch (operation.op) {
        case 'attribute':
          scope = new Scope({
            parent: scope,
            value: scope.value[operation.name]
          })
          console.log(operation.name, '=>', scope.value)
          break
        default:
          throw `Unkown accessor path element ${operation.op}`
      }
      if (!scope.value) {
        break
      }
    }
    return scope
  }
}
