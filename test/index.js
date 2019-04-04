const sendSecretEl = document.getElementById('sendSecret')
const sendBtnEl = document.getElementById('sendBtn')
const sendCodeEl = document.getElementById('sendCode')
const sendStatusEl = document.getElementById('sendStatus')

const origin = 'http://localhost:38881'
const wsOrigin = 'ws://localhost:38881'

sendBtnEl.addEventListener('click', async e => {
  try {
    const secret = sendSecretEl.value
    sendStatusEl.innerText = 'connecting'
    const res = await fetch(`${origin}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: secret
    })
    if (res.status !== 201) {
      sendCodeEl.innerText = ''
      sendStatus.innerText = `Error code: ${res.status}`
      return
    }
    const json = await res.json()
    console.log('json', json)
    sendCodeEl.innerText = `Code: ${json.code}`
    const socket = new WebSocket(`${wsOrigin}/status/${json.id}`)
    sendStatusEl.innerText = ''
    socket.onopen = event => {
      socket.onmessage = async event => {
        const blob = event.data
        const text = await (new Response(blob)).text()
        console.log('ws data:', text)
        sendStatusEl.innerText = text
      }
    }
  } catch (e) {
    console.error('Exception', e)
    sendStatusEl.innerText = e.message
  }
})

const receiveCodeEl = document.getElementById('receiveCode')
const receiveBtnEl = document.getElementById('receiveBtn')
const receiveSecretEl = document.getElementById('receiveSecret')
const receiveStatusEl = document.getElementById('receiveStatus')

const copyCodeBtnEl = document.getElementById('copyCodeBtn')
copyCodeBtnEl.addEventListener('click', async e => {
  receiveCodeEl.value = sendCodeEl.innerText.replace(/Code: /, '')
})


receiveBtnEl.addEventListener('click', async e => {
  try {
    const code = receiveCodeEl.value
    receiveSecretEl.innerText = ''
    receiveStatusEl.innerText = 'receiving'
    const res = await fetch(`${origin}/receive/${code}`)
    if (res.status !== 200) {
      try {
        const json = await res.json()
        receiveStatusEl.innerText = `Error code: ${res.status}, ${json.error}`
      } catch (e) {
        receiveStatusEl.innerText = `Error code: ${res.status}`
      }
      return
    }
    const secret = await res.text()
    console.log('secret', secret)
    receiveSecretEl.innerText = `Secret: ${secret}`
    receiveStatusEl.innerText = ''
  } catch (e) {
    console.error('Exception', e)
    receiveStatusEl.innerText = e.message
  }
})

