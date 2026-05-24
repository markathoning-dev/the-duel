import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateGameData, loadGameData, loadFromAPI, loadGameSeed } from '../src/game/data-loader.js'
import { readFileSync } from 'fs'

function validData() {
  return {
    seed: 42,
    quarterBoundaries: [0, 63, 126, 189, 252],
    assets: Array.from({ length: 6 }, (_, i) => ({
      id: `asset-${i}`,
      name: `Asset ${i}`,
      type: ['sukuk', 'equity', 'commodity', 'realestate'][i % 4],
      impurityRatio: i * 0.01,
      prices: Array.from({ length: 252 }, () => 100 + Math.random() * 10)
    }))
  }
}

describe('validateGameData', () => {
  it('passes on valid data', () => {
    expect(() => validateGameData(validData())).not.toThrow()
  })

  it('throws if data is null', () => {
    expect(() => validateGameData(null)).toThrow()
  })

  it('throws if seed is missing', () => {
    const d = validData()
    delete d.seed
    expect(() => validateGameData(d)).toThrow(/numeric seed/)
  })

  it('throws if quarterBoundaries are wrong', () => {
    const d = validData()
    d.quarterBoundaries = [0, 1, 2, 3]
    expect(() => validateGameData(d)).toThrow(/quarterBoundaries/)
  })

  it('throws if asset count is wrong', () => {
    const d = validData()
    d.assets = d.assets.slice(0, 3)
    expect(() => validateGameData(d)).toThrow(/exactly 6 assets/)
  })

  it('throws on missing asset id', () => {
    const d = validData()
    delete d.assets[0].id
    expect(() => validateGameData(d)).toThrow(/string id/)
  })

  it('throws on invalid asset type', () => {
    const d = validData()
    d.assets[0].type = 'crypto'
    expect(() => validateGameData(d)).toThrow(/invalid type/)
  })

  it('throws on out-of-range impurityRatio', () => {
    const d = validData()
    d.assets[0].impurityRatio = -0.1
    expect(() => validateGameData(d)).toThrow(/between 0 and 1/)
  })

  it('throws on wrong price count', () => {
    const d = validData()
    d.assets[0].prices = [100, 101]
    expect(() => validateGameData(d)).toThrow(/exactly 252 prices/)
  })

  it('throws on non-positive price', () => {
    const d = validData()
    d.assets[0].prices[0] = -10
    expect(() => validateGameData(d)).toThrow(/positive number/)
  })
})

describe('loadGameData', () => {
  it('loads and validates the mock game-seed.json', async () => {
    const json = JSON.parse(readFileSync('src/data/game-seed.json', 'utf-8'))
    expect(() => validateGameData(json)).not.toThrow()
    expect(json.seed).toBe(42)
    expect(json.assets).toHaveLength(6)
    expect(json.assets[0].prices).toHaveLength(252)
  })
})

describe('loadFromAPI', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    delete globalThis.fetch
  })

  it('loads and validates data from API', async () => {
    const data = validData()
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    })
    const result = await loadFromAPI(42)
    expect(result).toEqual(data)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/generate-game?seed=42'
    )
  })

  it('throws on API error response', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    })
    await expect(loadFromAPI(42)).rejects.toThrow('API error: 500')
  })

  it('throws on invalid response data', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invalid: true }),
    })
    await expect(loadFromAPI(42)).rejects.toThrow(/numeric seed/)
  })
})

describe('loadGameSeed', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    delete globalThis.fetch
  })

  it('loads from API when available', async () => {
    const data = validData()
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    })
    const result = await loadGameSeed(42)
    expect(result).toEqual(data)
  })

  it('falls back to static file when API fails', async () => {
    const data = validData()
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('generate-game')) {
        return Promise.resolve({ ok: false, status: 503 })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      })
    })
    const result = await loadGameSeed(42)
    expect(result.seed).toBe(42)
    expect(result.assets).toHaveLength(6)
    expect(result.assets[0].prices).toHaveLength(252)
  })
})
