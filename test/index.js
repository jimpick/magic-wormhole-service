const sendSecretEl = document.getElementById('sendSecret')
const sendBtnEl = document.getElementById('sendBtn')
const sendCodeEl = document.getElementById('sendCode')
const sendStatusEl = document.getElementById('sendStatus')

sendBtnEl.addEventListener('click', async e => {
  const secret = sendSecretEl.value
  const res = await fetch('http://localhost:3000/send', {
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
  const socket = new WebSocket(`ws://localhost:3000/status/${json.id}`)
  sendStatusEl.innerText = ''
  socket.onopen = event => {
    socket.onmessage = async event => {
      const blob = event.data
      const text = await (new Response(blob)).text()
      console.log('ws data:', text)
      sendStatusEl.innerText = text
    }
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
  const code = receiveCodeEl.value
  const url = `http://localhost:3000/receive/${code}`
  const res = await fetch(url)
  if (res.status !== 200) {
    receiveSecretEl.innerText = ''
    receiveStatusEl.innerText = `Error code: ${res.status}`
    return
  }
  const secret = await res.text()
  console.log('secret', secret)
  receiveSecretEl.innerText = `Secret: ${secret}`
  receiveStatusEl.innerText = ''
})

