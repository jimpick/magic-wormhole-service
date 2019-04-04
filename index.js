const { spawn } = require('child_process')
const EventEmitter = require('events')
const fastify = require('fastify')({ logger: true })

fastify.register(require('fastify-cors'))
fastify.register(require('fastify-websocket'), { handle: handleWebsocket })

const statuses = {}
const emitters = {}

function handleWebsocket (conn, req) {
  const match = req.url.match(/^\/status\/(.*)$/)
  if (!match) {
    conn.destroy()
    return
  }
  const id = match[1]
  console.log('Websocket connected for id:', id)
  conn.write(statuses[id])
  emitters[id].on('update', data => {
    console.log(`Sending update for ${id}:`, data)
    conn.write(data)
  })
}

fastify.post('/send', async (request, reply) => {
  const text = request.body
  if (!text) return { error: 'no body' }
  try {
    // wormhole send --text 'something secret'
    console.log('wormhole send --text <...>')
    const id = Math.random().toString(36).substr(2, 9)
    statuses[id] = 'starting'
    emitters[id] = new EventEmitter()
    const wormhole = spawn('wormhole', [ 'send', '--text', text ])
    const result = await (() => new Promise((resolve, reject) => {
      wormhole.stdout.on('data', data => {
        // wormhole receive 6-pandemic-artist
        console.log(`stdout: ${data}`)
      })
      wormhole.stderr.on('data', data => {
        console.log(`stderr: ${data}`)
        {
          const match = data.toString().match(/Wormhole code is: (.*)/)
          if (match) {
            statuses[id] = 'waiting'
            emitters[id].emit('update', statuses[id])
            resolve(match[1])
          }
        }
        {
          const match = data.toString().match(/text message sent/)
          if (match) {
            statuses[id] = 'sent'
            emitters[id].emit('update', statuses[id])
          }
        }
      })
      wormhole.on('close', code => {
        console.log(`child process exited with code ${code}`)
        if (statuses[id] !== 'sent') {
          statuses[id] = 'closed'
          emitters[id].emit('update', statuses[id])
        }
      })
    }))()
    reply.code(201)
    return {
      id,
      code: result
    }
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
