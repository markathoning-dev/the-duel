export function computeUnits(capital, allocation, prices) {
  const units = {}
  for (const [assetId, fraction] of Object.entries(allocation)) {
    if (fraction > 0 && prices[assetId]) {
      units[assetId] = (capital * fraction) / prices[assetId]
    }
  }
  return units
}

export function computePortfolioValue(units, prices) {
  return Object.entries(units).reduce((sum, [id, qty]) => {
    return sum + qty * (prices[id] || 0)
  }, 0)
}

export function computeReturn(startCapital, endCapital) {
  if (startCapital === 0) return Infinity
  return (endCapital - startCapital) / startCapital
}

export function computePortfolioImpurity(allocation, assets) {
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]))
  const totalAllocated = Object.values(allocation).reduce((s, v) => s + v, 0)
  if (totalAllocated === 0) return 0
  const weighted = Object.entries(allocation).reduce((sum, [id, frac]) => {
    return sum + frac * (assetMap[id]?.impurityRatio || 0)
  }, 0)
  return weighted / totalAllocated
}

export function computeScore(totalReturn, portfolioImpurity) {
  return totalReturn * (1 - portfolioImpurity)
}

export function computeCashReturn(cashFraction, riskFreeRate = 0.02) {
  return cashFraction * (riskFreeRate / 4)
}

export function computeFinalScore(transactions, assets) {
  let capital = transactions[0].capital
  const initialCapital = capital
  let units = {}
  let lastAllocation = {}

  for (const tx of transactions) {
    if (tx.allocation) {
      lastAllocation = tx.allocation
      units = computeUnits(capital, tx.allocation, tx.prices)
    } else if (tx.prices) {
      capital = computePortfolioValue(units, tx.prices)
    }
  }

  const totalReturn = computeReturn(initialCapital, capital)
  const portfolioImpurity = computePortfolioImpurity(lastAllocation, assets)
  const score = computeScore(totalReturn, portfolioImpurity)

  return { totalReturn, portfolioImpurity, score, finalCapital: capital }
}
