const axios = require('axios')
const qs = require('qs')
const express = require('express')
const parser = require('xml2json')
const getExternalIp = require('ext-ip')()
const logger = require('./logger')
const {
  hub,
  server: { port },
} = require('./config/app.json')

const app = express()

const listeners = {
  subscribe: [],
  unsubscribe: [],
  feed: [],
}

const hubRequest = async (topic, callbackUrl, mode) =>
  axios.post(
    hub,
    qs.stringify({
      'hub.callback': callbackUrl,
      'hub.topic': topic,
      'hub.verify': 'async',
      'hub.mode': mode,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

const subscribe = async (topic, callbackUrl) =>
  hubRequest(topic, callbackUrl, 'subscribe')

const unsubscribe = async (topic, callbackUrl) =>
  hubRequest(topic, callbackUrl, 'unsubscribe')

const on = (event, callback) => {
  listeners[event] = [...listeners[event], callback]
}

const emit = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach((listener) => listener(data))
  }
}

const getHandler = async (request, response) => {
  const query = request.query
  switch (query['hub.mode']) {
    case 'subscribe':
    case 'unsubscribe':
      response.writeHead(202, { 'Content-Type': 'text/plain' })
      response.end(query['hub.challenge'])
      break
    default:
      logger.warn('Unrecognised event received', query)
      return
  }
  emit(query['hub.mode'], query)
}

const postHandler = async (request, response) => {
  bodyLen = 0
  const maxContentSize = 3 * 1024 * 1024
  const chunks = []
  let tooLarge = false

  request.on('data', (chunk) => {
    if (!chunk || !chunk.length || tooLarge) {
      return
    }

    if (bodyLen + chunk.length <= maxContentSize) {
      chunks.push(chunk)
      bodyLen += chunk.length
    } else {
      tooLarge = true
    }
  })

  request.on('end', () => {
    response.writeHead(204, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end()
    if (!tooLarge) {
      const data = Buffer.concat(chunks, bodyLen)
      const result = JSON.parse(parser.toJson(data.toString()))
      emit('feed', result)
    }
  })
}

const startHandler = (topics) => {
  if (!topics || !topics.length) {
    throw new Error('No topics provided for subscription.')
  }

  app.listen(port, async () => {
    const publicIp = await getExternalIp()
    const callbackUrl = `http://${publicIp}:${port}`
    logger.info(`AlertR listening on ${callbackUrl}.`)

    topics.forEach((topic) => {
      logger.info(`Subscribing to topic: ${topic}.`)
      subscribe(topic, callbackUrl)
    })
  })
}

module.exports = (() => {
  app.get('/', getHandler)
  app.post('/', postHandler)

  return {
    start: startHandler,
    on,
    emit,
    subscribe,
    unsubscribe,
    hubRequest,
    listeners,
    getHandler,
    postHandler,
  }
})()
