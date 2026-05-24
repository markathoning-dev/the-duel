import { computeUnits, computePortfolioValue, computeReturn, computePortfolioImpurity, computeScore } from '../lib/math.js'

export function createInitialState(gameData) {
  return {
    phase: 'lobby',
    currentQuarter: 0,
    gameData,
    turnDuration: 60,
    turnTimeRemaining: 60,
    timerId: null,
    events: {},
    players: {},
    winner: null,
  }
}

export function createPlayerState(id, name) {
  return {
    id,
    name,
    capital: 100000,
    initialCapital: 100000,
    cash: 0,
    units: {},
    allocations: [],
    totalReturn: 0,
    portfolioImpurity: 0,
    score: 0,
  }
}

export function getPricesAtQuarter(gameData, quarterIndex) {
  const boundary = gameData.quarterBoundaries[quarterIndex]
  const prices = {}
  for (const asset of gameData.assets) {
    prices[asset.id] = asset.prices[boundary]
  }
  return prices
}

export function processAllocation(state, playerId, allocation) {
  const player = state.players[playerId]
  if (!player) return

  player.cash = allocation.cash || 0
  const investFraction = 1 - player.cash
  const investCapital = player.capital * investFraction
  const prices = getPricesAtQuarter(state.gameData, state.currentQuarter)

  const assetAlloc = { ...allocation }
  delete assetAlloc.cash

  const assetSum = Object.values(assetAlloc).reduce((s, v) => s + v, 0)
  if (assetSum > 0) {
    for (const key of Object.keys(assetAlloc)) {
      assetAlloc[key] = assetAlloc[key] / assetSum
    }
  }

  player.units = computeUnits(investCapital, assetAlloc, prices)
  player.allocations.push(allocation)
}

function getPlayerIds(state) {
  return Object.keys(state.players).filter(
    id => id !== 'local' && id !== 'opponent'
  )
}

export function evaluateQuarter(state) {
  const nextBoundary = state.gameData.quarterBoundaries[state.currentQuarter + 1]
  const prices = {}
  for (const asset of state.gameData.assets) {
    prices[asset.id] = asset.prices[nextBoundary]
  }

  for (const playerId of getPlayerIds(state)) {
    const player = state.players[playerId]
    player.capital = computePortfolioValue(player.units, prices)
    player.units = {}
  }
}

export function computeFinalScores(state) {
  for (const playerId of getPlayerIds(state)) {
    const player = state.players[playerId]
    player.totalReturn = computeReturn(player.initialCapital, player.capital)
    player.portfolioImpurity = computePortfolioImpurity(
      player.allocations[player.allocations.length - 1] || {},
      state.gameData.assets
    )
    player.score = computeScore(player.totalReturn, player.portfolioImpurity)
  }
}

export function determineWinner(state) {
  const ids = getPlayerIds(state)
  if (ids.length < 2) return null
  const [aId, bId] = ids
  const a = state.players[aId]
  const b = state.players[bId]
  if (a.score > b.score) return a.id
  if (b.score > a.score) return b.id
  return 'draw'
}
