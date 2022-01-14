const logger = (log) => (message, data) => {
  const timestamp = new Date().toISOString()
  if (!data) {
    log(`[${timestamp}] ${message}`)
  } else {
    log(`[${timestamp}] ${message}`, data)
  }
}

module.exports = {
  log: logger(console.log),
  info: logger(console.info),
  error: logger(console.error),
  warn: logger(console.warn),
}
