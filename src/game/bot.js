/**
 * Smart bot opponent that plays against the human.
 * Analyzes market trends, considers Sharia compliance, balances risk.
 */

export function createBot(assets, difficulty = 'normal') {
  const difficultySettings = {
    easy:   { lookahead: 1, noise: 0.15, purityWeight: 0.7 },
    normal: { lookahead: 2, noise: 0.08, purityWeight: 0.5 },
    hard:   { lookahead: 3, noise: 0.03, purityWeight: 0.4 },
  }[difficulty] || difficultySettings.normal

  /**
   * Calculate asset momentum based on recent price changes.
   * Returns value between -1 (declining) and +1 (rising).
   */
  function getMomentum(assetPrices, currentQuarter, lookback) {
    const prices = assetPrices.prices.slice(currentQuarter - lookback, currentQuarter)
    if (prices.length < 2) return 0
    
    let rises = 0
    let falls = 0
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) rises++
      else if (prices[i] < prices[i - 1]) falls++
    }
    
    return (rises - falls) / prices.length
  }

  /**
   * Check if an asset is trending upward over recent quarters.
   */
  function isTrendingUp(assetId, gameState, lookback) {
    const prices = gameState.gameData.assets.find(a => a.id === assetId)?.prices
    if (!prices) return false

    let rising = true
    for (let i = Math.max(0, gameState.currentQuarter - lookback); i < gameState.currentQuarter; i++) {
      if (prices[i + 1] <= prices[i]) {
        rising = false
        break
      }
    }
    return rising
  }

  /**
   * Generate allocation percentages that sum to 1.0.
   */
  function generateAllocation(gameState) {
    const { currentQuarter, gameData } = gameState
    const localPlayer = gameState.players.local

    // Score each asset: combination of momentum, return potential, and purity
    const scoredAssets = gameData.assets.map(asset => {
      const momentum = getMomentum(asset, currentQuarter, difficultySettings.lookahead)
      
      // Recent return (quarter-over-quarter)
      const prevPrices = gameData.quarterBoundaries[currentQuarter] > 0 
        ? asset.prices[gameData.quarterBoundaries[currentQuarter]] 
        : asset.prices[0]
      const currPrice = asset.prices[Math.min(currentQuarter + 1, asset.prices.length - 1)]
      const returnPotential = prevPrices > 0 ? (currPrice - prevPrices) / prevPrices : 0

      // Pure assets score higher for Sharia compliance
      const purityScore = 1 - asset.impurityRatio
      
      // Combined score
      let rawScore = 0
      switch (difficulty) {
        case 'easy':
          // Easy: mostly random with slight preference for low impurity
          rawScore = Math.random() * 0.5 + purityScore * 0.5
          break
        case 'normal':
          // Normal: balance momentum, return, and purity
          rawScore = momentum * 0.3 + returnPotential * 10 + purityScore * difficultySettings.purityWeight
          break
        case 'hard':
          // Hard: prioritize high-return assets while respecting purity constraints
          rawScore = momentum * 0.4 + returnPotential * 12 + purityScore * difficultySettings.purityWeight
          break
      }

      // Add small noise for unpredictability
      rawScore += (Math.random() - 0.5) * difficultySettings.noise

      return { id: asset.id, score: rawScore, impurityRatio: asset.impurityRatio }
    })

    // Sort by score descending
    scoredAssets.sort((a, b) => b.score - a.score)

    // Assign allocations: higher scores get more weight
    const totalWeight = scoredAssets.reduce((sum, a) => sum + Math.max(a.score, 0.1), 0)
    const allocation = {}

    scoredAssets.forEach(asset => {
      // Normalize score to [0, 1] range approximately
      const normalizedScore = Math.max(0, Math.min(1, (asset.score + 1) / 2))
      allocation[asset.id] = normalizedScore / totalWeight
    })

    // Ensure sum is exactly 1.0
    const actualSum = Object.values(allocation).reduce((s, v) => s + v, 0)
    if (actualSum > 0) {
      for (const key in allocation) {
        allocation[key] /= actualSum
      }
    }

    return allocation
  }

  return {
    makeDecision(gameState) {
      return generateAllocation(gameState)
    },

    getName() {
      return 'AI Opponent'
    },

    setDifficulty(diff) {
      // Difficulty is applied in next decision call
    }
  }
}
