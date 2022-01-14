const cache = require('../cache')
const { promises: fs } = require('fs')

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}))

describe('cache', () => {
  const cacheFilePath = '.cache'

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('exists', () => {
    it("should return true if stat doesn't throw", async () => {
      fs.stat.mockResolvedValue({})
      expect(await cache.exists(cacheFilePath)).toBeTruthy()
    })

    it('should return false if stat throws', async () => {
      fs.stat.mockRejectedValue({ code: 'ENOENT' })
      expect(await cache.exists(cacheFilePath)).toBeFalsy()
    })
  })

  describe('create', () => {
    it('should call fs.create with a string containing an empty array', async () => {
      await cache.create(cacheFilePath)
      expect(fs.writeFile).toHaveBeenCalledWith(cacheFilePath, '[]')
    })
  })

  describe('read', () => {
    it('should return an array of parsed data', async () => {
      const expectedCacheData = ['YT_VID_ID_1', 'YT_VID_ID_2']
      fs.readFile.mockResolvedValue('["YT_VID_ID_1","YT_VID_ID_2"]')

      expect(await cache.read(cacheFilePath)).toEqual(expectedCacheData)
    })
  })

  describe('contains', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should return true if the cache file contains a matching entry', async () => {
      fs.stat.mockResolvedValue({})
      fs.readFile.mockResolvedValue('["YT_VID_ID_1", "YT_VID_ID_2"]')

      expect(await cache.contains(cacheFilePath, 'YT_VID_ID_1')).toBeTruthy()
    })

    it('should return false if the cache file has no matching entry', async () => {
      fs.stat.mockResolvedValue({})
      fs.readFile.mockResolvedValue('["YT_VID_ID_1", "YT_VID_ID_2"]')

      expect(await cache.contains(cacheFilePath, '__NOT_FOUND__')).toBeFalsy()
    })

    it('should return false if the cache file does not exist', async () => {
      fs.stat.mockRejectedValue({ code: 'ENOENT' })

      expect(await cache.contains(cacheFilePath, '__NOT_FOUND__')).toBeFalsy()
    })
  })

  describe('append', () => {
    it('should append data', async () => {
      fs.readFile.mockResolvedValueOnce(`[
          "YT_VID_ID_1",
          "YT_VID_ID_2"
      ]`)

      await cache.append(cacheFilePath, '_NEW_LINK_')

      expect(fs.writeFile).toHaveBeenCalledWith(
        cacheFilePath,
        '[\n    "YT_VID_ID_1",\n    "YT_VID_ID_2",\n    "_NEW_LINK_"\n]'
      )
    })
  })
})
