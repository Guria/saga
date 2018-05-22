class Everything {
  constructor() {
    this.op = 'everything'
  }

  pipeOp(rhs) {
    switch (rhs.op) {
      case 'filter':
        return new Filter({
          source: this,
          filter: rhs.filter
        })
    }
  }
}

const everything = new Everything()

class Filter {
  constructor(options) {
    const {source, filter} = options
    this.op = 'filter'
    this.source = source
    this.filter = filter
  }

  pipeOp(rhs) {
    switch (rhs.op) {
      case 'filter':
        return new Filter({
          source: this.source,
          filter: new And(
            this.filter,
            rhs.filter
          )
        })
    }
  }
}

class Literal {
  constructor(options) {
    const {type, value} = options
    this.op = 'literal'
    this.type = type
    this.value = value
  }
}

class And {
  constructor(lhs, rhs) {
    this.op = 'and'
    this.lhs = lhs
    this.rhs = rhs
  }
}

class Eq {
  constructor(lhs, rhs) {
    this.op = 'eq'
    this.lhs = lhs
    this.rhs = rhs
  }
}

class Accessor {
  constructor(path) {
    this.op = 'accessor'
    this.path = path
  }

  dotOp(rhs) {
    switch (rhs.op) {
      case 'attribute':
        return new Accessor(this.path.concat([rhs]))
      case 'accessor':
        return new Accessor(this.path.concat(rhs.path))
    }
  }
}

class Attribute {
  constructor(name) {
    this.op = 'attribute'
    this.name = name
  }

  dotOp(rhs) {
    if (rhs.op == 'attribute') {
      return new Accessor([this, rhs])
    }
  }
}

const defaultOperators = {
  andOp(lhs, rhs) {
    return new And(lhs, rhs)
  },

  equalsOp(lhs, rhs) {
    return new Eq(lhs, rhs)
  }
}

function applyOperator(lhs, rhs, name) {

  // First see if there is a special handler for this operator in this
  // context, and if it returns a defined result for this op.
  const handlerName = `${name}Op`
  if (lhs[handlerName]) {
    const result = lhs[handlerName](rhs)
    if (result !== undefined) {
      return result
    }
  }

  // No? Let's see if we have a default impl for this operator
  if (!defaultOperators[handlerName]) {
    throw `Operator not supported: ${lhs.op} ${name} ${rhs.op}`
  }
  return defaultOperators[handlerName](lhs, rhs)
}

module.exports = {
  everything,
  Filter,
  Literal,
  Attribute,
  Accessor,
  applyOperator
}