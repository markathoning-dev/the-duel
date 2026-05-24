import { writeFileSync } from 'fs'

function generatePrices(start, annualReturn, volatility, days) {
  const dailyReturn = annualReturn / 252
  const dailyVol = volatility / Math.sqrt(252)
  const prices = [start]
  for (let i = 1; i < days; i++) {
    const drift = dailyReturn * prices[i - 1]
    const shock = dailyVol * prices[i - 1] * randomNormal()
    prices.push(prices[i - 1] + drift + shock)
  }
  return prices.map(p => Math.round(p * 100) / 100)
}

let z = 42
function randomNormal() {
  const u1 = (z = (z * 16807) % 2147483647) / 2147483647
  const u2 = (z = (z * 16807) % 2147483647) / 2147483647
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2)
}

const assets = [
  { id: 'sukuk-01', name: 'Saudi Sukuk Fund', type: 'sukuk', impurityRatio: 0,   start: 100, ret: 0.04, vol: 0.05 },
  { id: 'equity-01', name: 'Islamic Equity Fund', type: 'equity', impurityRatio: 0.05, start: 100, ret: 0.10, vol: 0.18 },
  { id: 'commodity-01', name: 'Halal Commodities Fund', type: 'commodity', impurityRatio: 0.02, start: 100, ret: 0.07, vol: 0.22 },
  { id: 'realestate-01', name: 'Sharia Real Estate Fund', type: 'realestate', impurityRatio: 0.01, start: 100, ret: 0.06, vol: 0.08 },
  { id: 'tech-01', name: 'Islamic Tech Index', type: 'equity', impurityRatio: 0.08, start: 100, ret: 0.15, vol: 0.28 },
  { id: 'green-sukuk-01', name: 'Green Sukuk Bond', type: 'sukuk', impurityRatio: 0,   start: 100, ret: 0.03, vol: 0.03 },
]

const data = {
  seed: 42,
  quarterBoundaries: [0, 63, 126, 189, 252],
  assets: assets.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    impurityRatio: a.impurityRatio,
    prices: generatePrices(a.start, a.ret, a.vol, 252)
  }))
}

writeFileSync('src/data/game-seed.json', JSON.stringify(data, null, 2))
console.log('Wrote src/data/game-seed.json')
