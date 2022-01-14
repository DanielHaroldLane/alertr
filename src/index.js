#!/usr/bin/env node
const axios = require('axios')
const cache = require('./cache')
const logger = require('./logger')
const server = require('./server')
const {
  topics,
  discordWebHook,
  discordChannelId,
  cacheFile,
} = require('./config/app.json')

const eventLoggingHandler = (data) => {
  logger.info(`Received ${data['hub.mode']} event: `, data)
}

const feedHandler = async (data) => {
  if (!data?.feed?.entry?.link?.href) return

  const dateTime = new Date().toISOString()
  const href = data?.feed?.entry?.link?.href

  if (!cache.exists(cacheFile)) {
    cache.create(cacheFile)
  }

  if (cache.contains(href)) {
    logger.info(`Cache contains ${href} - skipping Discord notification`)
    return
  }

  logger.info(`Notifying Discord channel that video content ${href} is live`)

  await axios.post(discordWebHook, {
    id: dateTime,
    type: 1,
    channel_id: discordChannelId,
    content: href,
  })

  cache.append(cacheFile, href)
}

server.on('subscribe', eventLoggingHandler)

server.on('unsubscribe', eventLoggingHandler)

server.on('feed', feedHandler)

server.start(topics)

module.exports = {
  eventLoggingHandler,
  feedHandler,
}
