import { renderLineChart } from '../lib/chart.js'
import { renderEventTimeline } from './event-card.js'

function impurityColor(ratio) {
  if (ratio <= 0.01) return 'var(--emerald)'
  if (ratio <= 0.05) return 'var(--warn, #e0a84c)'
  return 'var(--red)'
}

export function createDashboard(container, gameData, currentQuarter) {
  container.innerHTML = ''
  const header = document.createElement('div'); header.className = 'dash-header'
  header.innerHTML = `<h2>Quarter ${currentQuarter + 1} — Asset Performance</h2>`
  container.appendChild(header)
  if (gameData.events && gameData.events.length > 0) {
    const eventSection = document.createElement('div'); eventSection.className = 'event-timeline'
    container.appendChild(eventSection)
    renderEventTimeline(eventSection, gameData.events, currentQuarter)
  }
  const grid = document.createElement('div'); grid.className = 'asset-grid'
  gameData.assets.forEach((asset, i) => {
    const purityColor = impurityColor(asset.impurityRatio)
    const card = document.createElement('div'); card.className = 'asset-card'; card.dataset.assetId = asset.id
    const endIdx = gameData.quarterBoundaries[currentQuarter + 1]
    const visiblePrices = asset.prices.slice(0, endIdx)
    const currentPrice = visiblePrices.length > 0 ? visiblePrices[visiblePrices.length - 1] : 0
    const prevPrice = visiblePrices.length > 1 ? visiblePrices[visiblePrices.length - 2] : currentPrice
    const priceChange = currentPrice - prevPrice
    const changeSign = priceChange >= 0 ? '\u25B2' : '\u25BC'
    const changeClass = priceChange >= 0 ? 'positive' : 'negative'
    card.innerHTML = `
      <div class="asset-top">
        <span class="asset-name">${asset.name}</span>
        <span class="asset-type" data-type="${asset.type}">${asset.type}</span>
        <span class="asset-impurity">
          <span class="asset-impurity-dot" style="background:${purityColor}"></span>
          ${(asset.impurityRatio * 100).toFixed(0)}%
        </span>
      </div>
      <div class="asset-price-row">
        <span class="asset-price" id="price-${asset.id}" style="color:${purityColor}">$${currentPrice.toFixed(2)}</span>
        <span class="asset-change ${changeClass}">${changeSign} ${Math.abs(priceChange).toFixed(2)}</span>
      </div>
      <div class="chart-wrap"><canvas data-asset="${asset.id}"></canvas></div>
    `
    grid.appendChild(card)
    container.appendChild(grid)
    const canvas = card.querySelector('canvas')
    renderLineChart(canvas, visiblePrices, {
      color: purityColor, boundaries: gameData.quarterBoundaries.slice(1, -1),
      currentQuarter, quarterBoundaries: gameData.quarterBoundaries, events: gameData.events || [],
    })
  })
}
