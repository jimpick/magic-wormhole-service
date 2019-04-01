const { spawn } = require('child_process')
const fastify = require('fastify')({ logger: true })

fastify.post('/send', async (request, reply) => {
  const text = request.body
  if (text) {
    // wormhole send --text 'something secret'
    const wormhole = spawn(
      'wormhole',
      [ 'send', '--text', text ]
    )
    try {
      const result = await (() => new Promise((resolve, reject) => {
        wormhole.stdout.on('data', data => {
          // wormhole receive 6-pandemic-artist
          console.log(`stdout: ${data}`)
        })
        wormhole.stderr.on('data', data => {
          console.log(`stderr: ${data}`)
          const match = data.toString().match(/Wormhole code is: (.*)/)
          if (match) resolve(match[1])
        })
        wormhole.on('close', code => {
          console.log(`child process exited with code ${code}`)
        })
      }))()
      return { passphrase: result }
    } catch (e) {
      console.error('Exception', e)
      return { error: 'exception' }
    }
  } else {
    return { error: 'no body' }
  }
})

const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
