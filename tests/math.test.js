import { describe, it, expect } from 'vitest'
import {
  computeUnits,
  computePortfolioValue,
  computeReturn,
  computePortfolioImpurity,
  computeScore,
  computeFinalScore,
  computeCashReturn
} from '../src/lib/math.js'

const mockAssets = [
  { id: 'a1', name: 'A1', type: 'sukuk', impurityRatio: 0 },
  { id: 'a2', name: 'A2', type: 'equity', impurityRatio: 0.05 },
  { id: 'a3', name: 'A3', type: 'commodity', impurityRatio: 0.02 },
]

describe('computeUnits', () => {
  it('calculates units held for each asset', () => {
    const capital = 100000
    const allocation = { a1: 0.5, a2: 0.3, a3: 0.2 }
    const prices = { a1: 100, a2: 200, a3: 50 }
    const units = computeUnits(capital, allocation, prices)
    expect(units.a1).toBe(500)
    expect(units.a2).toBe(150)
    expect(units.a3).toBe(400)
  })

  it('handles 100% allocation to one asset', () => {
    const units = computeUnits(100000, { a1: 1 }, { a1: 50 })
    expect(units.a1).toBe(2000)
  })

  it('returns empty object for empty allocation', () => {
    const units = computeUnits(100000, {}, { a1: 100 })
    expect(units).toEqual({})
  })
})

describe('computePortfolioValue', () => {
  it('values portfolio at given prices', () => {
    const units = { a1: 500, a2: 150, a3: 400 }
    const prices = { a1: 110, a2: 190, a3: 55 }
    const value = computePortfolioValue(units, prices)
    expect(value).toBe(500 * 110 + 150 * 190 + 400 * 55)
  })

  it('returns 0 for empty portfolio', () => {
    expect(computePortfolioValue({}, { a1: 100 })).toBe(0)
  })
})

describe('computeReturn', () => {
  it('calculates positive return', () => {
    expect(computeReturn(100000, 120000)).toBeCloseTo(0.2)
  })

  it('calculates negative return', () => {
    expect(computeReturn(100000, 80000)).toBeCloseTo(-0.2)
  })

  it('returns 0 for no change', () => {
    expect(computeReturn(100000, 100000)).toBe(0)
  })

  it('handles zero capital', () => {
    expect(computeReturn(0, 100)).toBe(Infinity)
  })
})

describe('computePortfolioImpurity', () => {
  it('computes weighted average impurity', () => {
    const allocation = { a1: 0.5, a2: 0.3, a3: 0.2 }
    const expected = 0.5 * 0 + 0.3 * 0.05 + 0.2 * 0.02
    expect(computePortfolioImpurity(allocation, mockAssets)).toBeCloseTo(expected)
  })

  it('returns 0 for all-clean portfolio', () => {
    const allocation = { a1: 1 }
    expect(computePortfolioImpurity(allocation, mockAssets)).toBe(0)
  })

  it('handles empty allocation', () => {
    expect(computePortfolioImpurity({}, mockAssets)).toBe(0)
  })
})

describe('computeScore', () => {
  it('computes purity-adjusted return', () => {
    expect(computeScore(0.2, 0.05)).toBeCloseTo(0.19)
  })

  it('returns total return when impurity is 0', () => {
    expect(computeScore(0.15, 0)).toBe(0.15)
  })

  it('returns 0 when impurity is 1', () => {
    expect(computeScore(0.2, 1)).toBe(0)
  })

  it('handles negative returns', () => {
    expect(computeScore(-0.1, 0.05)).toBeCloseTo(-0.095)
  })
})

describe('computeCashReturn', () => {
  it('returns expected value for positive cash fraction', () => {
    expect(computeCashReturn(0.25, 0.02)).toBeCloseTo(0.00125, 5)
  })

  it('returns 0 when cash fraction is 0', () => {
    expect(computeCashReturn(0, 0.02)).toBe(0)
  })

  it('returns expected value for 100% cash', () => {
    expect(computeCashReturn(1, 0.02)).toBeCloseTo(0.005, 5)
  })

  it('uses default risk-free rate of 2%', () => {
    expect(computeCashReturn(0.5)).toBeCloseTo(0.0025, 5)
  })
})

describe('computeFinalScore', () => {
  it('computes full game score for a player', () => {
    const transactions = [
      { capital: 100000, allocation: { a1: 0.5, a2: 0.5 }, prices: { a1: 100, a2: 200 } },
      { prices: { a1: 110, a2: 190 } },
      { capital: 92500, allocation: { a1: 0.3, a2: 0.7 }, prices: { a1: 110, a2: 190 } },
      { prices: { a1: 105, a2: 210 } },
    ]
    const result = computeFinalScore(transactions, mockAssets)
    expect(result).toHaveProperty('totalReturn')
    expect(result).toHaveProperty('portfolioImpurity')
    expect(result).toHaveProperty('score')
    expect(typeof result.score).toBe('number')
  })
})
