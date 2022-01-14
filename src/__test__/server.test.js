const axios = require('axios')
const express = require('express')
const logger = require('../logger')
require('ext-ip')
const server = require('../server')
const config = require('../config/app.json')
const { listeners } = require('../server')

jest.mock('../config/app.json', () => ({
  hub: '__HUB__',
  server: { port: 1234 },
}))
jest.mock('axios')
jest.mock('../logger')
jest.mock('express', () => () => ({
  listen: jest.fn(),
  post: jest.fn(),
  get: jest.fn(),
}))
jest.mock('ext-ip', () => () => jest.fn())

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
      server.listeners.subscribe = [mockSubscriber]

      const mockExpressRequest = {
        query: { 'hub.mode': 'subscribe', 'hub.challenge': 1234 },
      }
      const mockExpressResponse = { writeHead: jest.fn(), end: jest.fn() }
      await server.getHandler(mockExpressRequest, mockExpressResponse)
      expect(mockExpressResponse.end).toHaveBeenCalledWith(1234)
      expect(mockSubscriber).toHaveBeenCalledWith(mockExpressRequest.query)
    })

    it('should warn when getHandler does not recognise the event', async () => {
      const mockSubscriber = jest.fn()
      server.listeners.subscribe = [mockSubscriber]

      const mockExpressRequest = {
        query: { 'hub.mode': 'unsupported', 'hub.challenge': 1234 },
      }
      await server.getHandler(mockExpressRequest, null)
      expect(logger.warn).toHaveBeenCalledWith(
        'Unrecognised event received',
        mockExpressRequest.query
      )
    })
  })
})
