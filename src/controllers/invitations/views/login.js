// -- oops, the accidental templating thingy
const flattenTwice = arr => arr.reduce((flattened, item) => flattened.concat(...item), [])
const toAttrs = attrs => Object.keys(attrs).map(key => `${key}="${attrs[key]}"`)

const renderChildren = (...children) => flattenTwice(children).join('')

const h = (tagName, attrs = {}) => {
  const next = (...children) =>
    `<${[tagName, ...toAttrs(attrs)].join(' ')}>${renderChildren(children)}</${tagName}>`
  next.toString = next.call.bind(next)
  return next
}

const unary = fn => value => fn(value)

const renderProvider = provider => h('div')(h('a', {href: provider.url})(provider.title))

module.exports = ({providers, script}) =>
  h('html')(
    h('head')(h('script')(script)),
    h('body')(
      h('h2')('Select provider'),
      h('ul')(providers.map(unary(renderProvider)).map(unary(h('li'))))
    )
  )
