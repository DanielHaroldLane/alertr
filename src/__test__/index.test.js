require('../server')
const logger = require('../logger')
const cache = require('../cache')
const axios = require('axios')
const { eventLoggingHandler, feedHandler } = require('../index')

jest.mock('axios')
jest.mock('../server')
jest.mock('../logger')
jest.mock('../cache')

const isoStringMock = '2022-01-14T15:56.000Z'
jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(isoStringMock)

describe('index', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('eventLoggingHandler', () => {
    it('should call logger.info with the event info', () => {
      const mockData = { 'hub.mode': 'subscribe', payload: {} }
      eventLoggingHandler(mockData)
      expect(logger.info).toHaveBeenCalled()
    })
  })

  describe('feedHandler', () => {
    beforeEach(() => {
      cache.contains.mockReturnValue(true)
      cache.exists.mockReturnValue(false)
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it('should exit early if data payload does not contain a YouTube video link', async () => {
      await feedHandler({})
      expect(cache.exists).not.toHaveBeenCalled()
    })

    it('should not create the cache file if it exists', async () => {
      cache.exists.mockReturnValueOnce(true)
      cache.contains.mockReturnValue(true)

      await feedHandler({ feed: { entry: { link: { href: 'LINK' } } } })

      expect(cache.create).not.toHaveBeenCalled()
    })

    it('should create the cache file if it does not exist', async () => {
      await feedHandler({ feed: { entry: { link: { href: 'LINK' } } } })

      expect(cache.create).toHaveBeenCalled()
    })

    it('should exit early if the YouTube video link exists in the cache', async () => {
      cache.exists.mockReturnValueOnce(true)
      cache.contains.mockReturnValueOnce(true)

      await feedHandler({ feed: { entry: { link: { href: 'LINK' } } } })

      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should post a message to discord if the YouTube link is not in the cache', async () => {
      cache.exists.mockReturnValueOnce(true)
      cache.contains.mockReturnValueOnce(false)

      await feedHandler({ feed: { entry: { link: { href: 'LINK' } } } })

      expect(axios.post).toHaveBeenCalled()
    })
  })
})
