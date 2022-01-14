require('express')
require('ext-ip')()
const axios = require('axios')
const logger = require('../logger')
const server = require('../server')
const { YOUTUBE_JSON, YOUTUBE_XML } = require('./__fixtures__/youtube.fixture')

jest.mock('axios')
jest.mock('../logger')
jest.mock('../config/app.json', () => ({
  hub: '__HUB__',
  server: { port: 1234 },
}))
jest.mock('express', () => () => ({
  listen: jest.fn((port, callback) => callback()),
  post: jest.fn(),
  get: jest.fn(),
}))
jest.mock('ext-ip', () => () => jest.fn().mockResolvedValue('__MOCK_IP__'))

describe('server', () => {
  describe('listeners', () => {
    afterAll(() => {
      server.listeners.subscribe = []
    })
    it('should add an event handler to the listeners correctly', () => {
      const subscribeHandlerMock = jest.fn()
      const eventDataMock = { mock: 'data' }
      server.on('subscribe', subscribeHandlerMock)

      expect(server.listeners.subscribe).toEqual(
        expect.arrayContaining([subscribeHandlerMock])
      )

      server.emit('subscribe', eventDataMock)
      expect(subscribeHandlerMock).toHaveBeenCalledWith(eventDataMock)
      server.listeners.subscribe = []
    })
  })

  describe('handlers', () => {
    it('subscribe should post data to the specified hub', async () => {
      server.subscribe('topic.address', 'callbackUrl')
      expect(axios.post).toHaveBeenCalledWith(
        '__HUB__',
        'hub.callback=callbackUrl&hub.topic=topic.address&hub.verify=async&hub.mode=subscribe',
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
    })

    it('unsubscribe should post data to the specified hub', async () => {
      server.unsubscribe('topic.address', 'callbackUrl')
      expect(axios.post).toHaveBeenCalledWith(
        '__HUB__',
        'hub.callback=callbackUrl&hub.topic=topic.address&hub.verify=async&hub.mode=unsubscribe',
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
    })

    it('should process getHandler subscribe event correctly', async () => {
      const mockSubscriber = jest.fn()
      const mockExpressRequest = {
        query: { 'hub.mode': 'subscribe', 'hub.challenge': 1234 },
      }
      const mockExpressResponse = { writeHead: jest.fn(), end: jest.fn() }

      server.listeners.subscribe = [mockSubscriber]

      await server.getHandler(mockExpressRequest, mockExpressResponse)

      expect(mockExpressResponse.writeHead).toHaveBeenCalledWith(
        202,
        expect.anything()
      )
      expect(mockExpressResponse.end).toHaveBeenCalledWith(1234)
      expect(mockSubscriber).toHaveBeenCalledWith(mockExpressRequest.query)
    })

    it('should respond 500 when getHandler does not recognise the event', async () => {
      const mockSubscriber = jest.fn()
      server.listeners.subscribe = [mockSubscriber]

      const mockExpressRequest = {
        query: { 'hub.mode': 'unsupported', 'hub.challenge': 1234 },
      }

      const mockExpressResponse = { writeHead: jest.fn(), end: jest.fn() }

      await server.getHandler(mockExpressRequest, mockExpressResponse)
      expect(logger.warn).toHaveBeenCalledWith(
        'Unrecognised event received',
        mockExpressRequest.query
      )
      expect(mockExpressResponse.writeHead).toHaveBeenCalledWith(
        500,
        expect.anything()
      )
      expect(mockExpressResponse.end).toHaveBeenCalled()
    })
  })

  describe('postHandler', () => {
    const utf8Encode = new TextEncoder()
    const mockChunk = Buffer.from(utf8Encode.encode(YOUTUBE_XML))
    const onMock = (_, callback) => {
      callback(mockChunk)
    }

    it('should emit data if message complete', async () => {
      const mockFeedHandler = jest.fn()
      server.listeners.feed = [mockFeedHandler]
      const requestMock = { on: onMock }
      const responseMock = { writeHead: jest.fn(), end: jest.fn() }

      await server.postHandler(requestMock, responseMock)
      expect(mockFeedHandler).toHaveBeenCalledWith(YOUTUBE_JSON)
    })
  })

  describe('startHandler', () => {
    it('should throw if no topics are provided', () => {
      expect(server.start).toThrow()
    })

    it('should subscribe without throwing', async () => {
      const mockTopic1 = '__MOCK_TOPIC_1__'
      const mockTopic2 = '__MOCK_TOPIC_2__'

      expect(() => server.start([mockTopic1, mockTopic2])).not.toThrow()
    })
  })
})
