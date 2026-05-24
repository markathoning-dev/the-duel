import { fetchGameData } from '../lib/api.js'

const REQUIRED_ASSETS = 6
const REQUIRED_PRICES = 252
const REQUIRED_BOUNDARIES = [0, 63, 126, 189, 252]

export async function loadGameData(url) {
  const response = await fetch(url || 'data/game-seed.json')
  if (!response.ok) {
    throw new Error(`Failed to load game data: ${response.status}`)
  }
  const data = await response.json()
  validateGameData(data)
  return data
}

export async function loadFromAPI(seed = 42) {
  const data = await fetchGameData(seed)
  validateGameData(data)
  return data
}

export async function loadGameSeed(seed = 42) {
  try {
    console.log('Attempting to load from API...')
    return await loadFromAPI(seed)
  } catch (err) {
    console.warn('API unavailable, falling back to static seed:', err.message)
    return loadGameData()
  }
}

export function validateGameData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Game data must be a JSON object')
  }
  if (typeof data.seed !== 'number') {
    throw new Error('Game data must have a numeric seed')
  }
  if (!Array.isArray(data.quarterBoundaries) ||
      data.quarterBoundaries.length !== REQUIRED_BOUNDARIES.length ||
      !data.quarterBoundaries.every((v, i) => v === REQUIRED_BOUNDARIES[i])) {
    throw new Error(`quarterBoundaries must be [${REQUIRED_BOUNDARIES.join(', ')}]`)
  }
  if (!Array.isArray(data.assets) || data.assets.length !== REQUIRED_ASSETS) {
    throw new Error(`Game data must have exactly ${REQUIRED_ASSETS} assets`)
  }
  data.assets.forEach((asset, i) => {
    if (!asset.id || typeof asset.id !== 'string') {
      throw new Error(`Asset ${i} must have a string id`)
    }
    if (!asset.name || typeof asset.name !== 'string') {
      throw new Error(`Asset ${i} must have a string name`)
    }
    if (!['sukuk', 'equity', 'commodity', 'realestate'].includes(asset.type)) {
      throw new Error(`Asset ${i} has invalid type "${asset.type}"`)
    }
    if (typeof asset.impurityRatio !== 'number' ||
        asset.impurityRatio < 0 || asset.impurityRatio > 1) {
      throw new Error(`Asset ${i} impurityRatio must be a number between 0 and 1`)
    }
    if (!Array.isArray(asset.prices) || asset.prices.length !== REQUIRED_PRICES) {
      throw new Error(`Asset ${i} must have exactly ${REQUIRED_PRICES} prices`)
    }
    asset.prices.forEach((p, j) => {
      if (typeof p !== 'number' || p <= 0) {
        throw new Error(`Asset ${i} price[${j}] must be a positive number`)
      }
    })
  })
}
