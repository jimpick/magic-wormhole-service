const { spawn } = require('child_process')
const fastify = require('fastify')({ logger: true })

fastify.post('/send', async (request, reply) => {
  const text = request.body
  if (!text) return { error: 'no body' }
  try {
    // wormhole send --text 'something secret'
    console.log('wormhole send --text <...>')
    const wormhole = spawn('wormhole', [ 'send', '--text', text ])
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
    return { code: result }
  } catch (e) {
    console.error('Exception', e)
    return { error: 'exception' }
  }
})

fastify.get('/receive/:code', async (request, reply) => {
  const { code } = request.params
  if (!code) return { error: 'need code' }
  try {
    console.log('wormhole receive', code)
    const wormhole = spawn('wormhole', [ 'receive', code ])
    const result = await (() => new Promise((resolve, reject) => {
      let resultString = ''
      wormhole.stdout.on('data', data => {
        console.log(`stdout: ${data}`)
        resultString += data.toString()
      })
      wormhole.stderr.on('data', data => {
        console.log(`stderr: ${data}`)
      })
      wormhole.on('close', code => {
        console.log(`child process exited with code ${code}`)
        resolve(resultString)
      })
    }))()
    return result
  } catch (e) {
    console.error('Exception', e)
    return { error: 'exception' }
  }
  return 'Test'
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
