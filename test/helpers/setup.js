process.on('unhandledRejection', reason => {
  if (!reason.message.includes('addExpectationResult')) {
    // eslint-disable-next-line no-console
    console.error('UNHANDLED REJECTION', reason)
  }
})
