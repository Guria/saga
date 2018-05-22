const parse = require('../parse')
const plan = require('../plan')
const exec = require('../exec')

// Entry point for query engine. Accepts a GROQ-query + a fetcher to retrieve
// data from the data source, parses, plans out and then executes the query.
// The fetcher is a query that will receive a filter expression and is expected
// to return a promise that resolves to an array of documents. The fetcher must
// provide all documents matching the filter expression, but may provide false
// positives as all documents are double checked against the filter in the
// executor. That means: a fetcher may actually return the entire database
// every time and still be compliant, although potentially slow.

module.exports = async function query(source, params, fetcher) {
  console.log("query:", source, "params:", params, "fetcher:", fetcher)
  const ast = parse(source, params)
  console.log(JSON.stringify(ast))
  const operations = plan(ast)
  console.log(JSON.stringify(operations, null, 2))
  // fetcher = (filter) => {
  //   console.log("fetch:", filter)
  //   return new Promise((resolve, reject) => {
  //     resolve([
  //       {
  //         a: 1,
  //         b: "one"
  //       },
  //       {
  //         a: 2,
  //         b: "two"
  //       }
  //     ])
  //   })
  // }
  const resultScope = await exec({
    operations,
    fetcher
  })

  return resultScope.value
}
