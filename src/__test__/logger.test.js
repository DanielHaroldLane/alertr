const consoleInfoMock = jest.spyOn(global.console, 'info').mockImplementation()
const isoStringMock = '__MOCKED_DATE_TIME__'
jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(isoStringMock)
const logger = require('../logger')

describe('logger', () => {
  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('info', () => {
    it('should prepend date to the message argument', () => {
      logger.info('Hello World')
      expect(consoleInfoMock).toHaveBeenCalledWith(
        '[__MOCKED_DATE_TIME__] Hello World'
      )
    })

    it('should log data if passed in', () => {
      const data = { event: 'data' }
      logger.info('Hello World', data)
      expect(consoleInfoMock).toHaveBeenCalledWith(
        '[__MOCKED_DATE_TIME__] Hello World',
        data
      )
    })
  })
})
