import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGameEngine } from '../src/game/engine.js'
import { loadGameData } from '../src/game/data-loader.js'
import { readFileSync } from 'fs'

let gameData

beforeEach(async () => {
  const json = JSON.parse(readFileSync('src/data/game-seed.json', 'utf-8'))
  gameData = json
})

describe('createGameEngine', () => {
  it('creates engine in lobby phase', () => {
    const engine = createGameEngine(gameData, 'player-1', 'Alice')
    expect(engine.getState().phase).toBe('lobby')
  })

  it('sets initial capital for local player', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    expect(engine.getState().players.local.capital).toBe(100000)
    expect(engine.getState().players.local.name).toBe('Alice')
  })
})

describe('engine lifecycle', () => {
  it('transitions from lobby to quarter-1 when both join', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    expect(engine.getState().phase).toBe('quarter-1')
    expect(engine.getState().currentQuarter).toBe(0)
  })

  it('gets prices at quarter boundary', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const prices = engine.getCurrentPrices()
    expect(Object.keys(prices)).toHaveLength(6)
    Object.values(prices).forEach(p => {
      expect(typeof p).toBe('number')
      expect(p).toBeGreaterThan(0)
    })
  })

  it('fires quarter-start event on game start', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    const handler = vi.fn()
    engine.on('quarter-start', handler)
    engine.joinOpponent('p2', 'Bob')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ quarter: 0 }))
  })
})

describe('allocation and scoring', () => {
  it('processes allocation for local player', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const assets = gameData.assets
    const allocation = {}
    allocation[assets[0].id] = 0.5
    allocation[assets[1].id] = 0.5
    engine.submitAllocation('p1', allocation)
    const state = engine.getState()
    expect(state.players.local.allocations[0]).toEqual(allocation)
  })

  it('does not switch quarter until both submit', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const assets = gameData.assets
    const allocation = {}
    allocation[assets[0].id] = 1
    engine.submitAllocation('p1', allocation)
    expect(engine.getState().phase).toBe('quarter-1')
  })

  it('advances quarter when both submit', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const assets = gameData.assets
    engine.submitAllocation('p1', { [assets[0].id]: 1 })
    engine.submitAllocation('p2', { [assets[1].id]: 1 })
    expect(engine.getState().currentQuarter).toBe(1)
    expect(engine.getState().phase).toBe('quarter-2')
  })

  it('fires quarter-end event after both submit', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const handler = vi.fn()
    engine.on('quarter-end', handler)
    const assets = gameData.assets
    engine.submitAllocation('p1', { [assets[0].id]: 1 })
    engine.submitAllocation('p2', { [assets[1].id]: 1 })
    expect(handler).toHaveBeenCalled()
  })

  it('fires game-over after quarter 4 both submit', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const handler = vi.fn()
    engine.on('game-over', handler)
    const assets = gameData.assets
    const singleAlloc = { [assets[0].id]: 1 }
    const otherAlloc = { [assets[1].id]: 1 }
    for (let q = 0; q < 4; q++) {
      engine.submitAllocation('p1', singleAlloc)
      engine.submitAllocation('p2', otherAlloc)
    }
    expect(handler).toHaveBeenCalled()
    expect(engine.getState().phase).toBe('results')
  })

  it('computes scores after game over', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const assets = gameData.assets
    for (let q = 0; q < 4; q++) {
      engine.submitAllocation('p1', { [assets[0].id]: 1 })
      engine.submitAllocation('p2', { [assets[1].id]: 1 })
    }
    const state = engine.getState()
    expect(state.players.local.score).toBeDefined()
    expect(state.players.opponent.score).toBeDefined()
    expect(state.winner).toBeDefined()
  })

  it('auto-submits on timer expiry', () => {
    vi.useFakeTimers()
    const engine = createGameEngine(gameData, 'p1', 'Alice', { turnDuration: 60 })
    engine.joinOpponent('p2', 'Bob')
    engine.submitAllocation('p1', { [gameData.assets[0].id]: 1 })
    vi.advanceTimersByTime(60000)
    const state = engine.getState()
    expect(state.currentQuarter).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('detects winner', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const assets = gameData.assets
    for (let q = 0; q < 4; q++) {
      engine.submitAllocation('p1', { [assets[0].id]: 1 })
      engine.submitAllocation('p2', { [assets[1].id]: 1 })
    }
    const state = engine.getState()
    expect(['p1', 'p2', 'draw']).toContain(state.winner)
  })
})

describe('opponent state', () => {
  it('tracks opponent allocations', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const assets = gameData.assets
    engine.submitAllocation('p2', { [assets[2].id]: 1 })
    expect(engine.getState().players.opponent.allocations[0]).toBeDefined()
  })
})

describe('rebalance', () => {
  it('triggerRebalance starts rebalance mode', () => {
    vi.useFakeTimers()
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    engine.triggerRebalance({ type: 'macro-event' })
    const state = engine.getState()
    expect(state.isRebalancing).toBe(true)
    expect(state.rebalanceSeconds).toBe(30)
    expect(state.rebalanceEvent).toEqual({ type: 'macro-event' })
    vi.useRealTimers()
  })

  it('submitRebalance ends rebalance when both submit', () => {
    vi.useFakeTimers()
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    engine.triggerRebalance({ type: 'macro-event' })
    const assets = gameData.assets
    engine.submitRebalance('p1', { [assets[0].id]: 1, cash: 0 })
    expect(engine.getState().isRebalancing).toBe(true)
    engine.submitRebalance('p2', { [assets[1].id]: 1, cash: 0 })
    expect(engine.getState().isRebalancing).toBe(false)
    vi.useRealTimers()
  })

  it('rebalance timer expiry ends rebalance mode', () => {
    vi.useFakeTimers()
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    engine.triggerRebalance({ type: 'macro-event' })
    vi.advanceTimersByTime(30000)
    const state = engine.getState()
    expect(state.isRebalancing).toBe(false)
    vi.useRealTimers()
  })

  it('fires rebalance-start event', () => {
    const engine = createGameEngine(gameData, 'p1', 'Alice')
    engine.joinOpponent('p2', 'Bob')
    const handler = vi.fn()
    engine.on('rebalance-start', handler)
    engine.triggerRebalance({ type: 'test' })
    expect(handler).toHaveBeenCalledWith({ event: { type: 'test' }, seconds: 30 })
  })
})
