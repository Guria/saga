module.exports = (req, res, next) => {
  res.writeHead(200, 'OK', {
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream'
  })

  res.write('event: welcome\n')
  res.write(`data: ${JSON.stringify({listenerName: 'hei'})}\n\n`)

  setTimeout(() => res.end(), 10000)
}
