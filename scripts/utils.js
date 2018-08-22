const fetch = require('node-fetch')
const inquirer = require('inquirer')

export function createAllIfNotExists(transaction, docs) {
  return docs.reduce((trx, doc) => trx.createIfNotExists(doc), transaction)
}
export const prompt = questions => inquirer.prompt(questions)
prompt.Separator = inquirer.Separator
prompt.single = question => prompt([{...question, name: 'value'}]).then(answers => answers.value)

export async function ensureConnected(serverUrl) {
  try {
    await fetch(serverUrl)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      await prompt.single({
        message:
          'The Saga server does not seem to be running. Please start it with `npm start` and press enter to continue.',
        type: 'input',
        prefix: '✋'
      })
      await ensureConnected(serverUrl)
      return
    }
    throw err
  }
}
