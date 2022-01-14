const { promises: fs } = require('fs')
const util = require('util')
const { logFile } = require('./config/app.json')

const logger = (log) => async (message, data) => {
  const timestamp = new Date().toISOString()
  const messageLog = `[${timestamp}] ${message}`
  if (!data) {
    log(messageLog)
    await fs.appendFile(logFile, util.format(messageLog) + '\n')
  } else {
    log(messageLog, data)
    await fs.appendFile(logFile, util.format(messageLog, data) + '\n')
  }
}

module.exports = {
  log: logger(console.log),
  info: logger(console.info),
  error: logger(console.error),
  warn: logger(console.warn),
}
