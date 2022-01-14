const { promises: fs } = require('fs')

const exists = async (cachePath) => {
  try {
    await fs.stat(cachePath)
    return true
  } catch (err) {
    return false
  }
}

const create = async (cachePath) => fs.writeFile(cachePath, '[]')

const read = async (cachePath) => {
  const cache = await fs.readFile(cachePath, 'utf-8')
  return JSON.parse(cache)
}

const contains = async (cachePath, link) => {
  const cacheExists = await exists(cachePath)
  if (!cacheExists) {
    return false
  }

  const cacheData = await read(cachePath)
  return cacheData.includes(link)
}

const append = async (cachePath, link) => {
  const cache = await read(cachePath)

  cache.push(link)

  await fs.writeFile(cachePath, JSON.stringify(cache, null, 4))
}

module.exports = {
  contains,
  exists,
  append,
  read,
  create,
}
