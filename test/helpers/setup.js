process.on('unhandledRejection', reason => {
  console.error('UNHANDLED REJECTION', reason)
})
