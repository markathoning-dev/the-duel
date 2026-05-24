import { renderLineChart, renderLineChartScrubber } from '../lib/chart.js'
import { renderEventTimeline } from './event-card.js'

export function createDashboard(container, gameData, currentQuarter) {
  container.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'dash-header'
  header.innerHTML = `<h2>Quarter ${currentQuarter + 1} — Asset Performance</h2>`
  container.appendChild(header)

  // Event timeline
  if (gameData.events && gameData.events.length > 0) {
    const eventSection = document.createElement('div')
    eventSection.className = 'event-timeline'
    container.appendChild(eventSection)
    renderEventTimeline(eventSection, gameData.events, currentQuarter)
  }

  const grid = document.createElement('div')
  grid.className = 'asset-grid'

  const boundaries = gameData.quarterBoundaries.slice(1, -1)

  gameData.assets.forEach((asset, i) => {
    const card = document.createElement('div')
    card.className = 'asset-card'
    const complianceScore = asset.complianceScores ? asset.complianceScores[currentQuarter] : null
    card.innerHTML = `
      <div class="asset-info">
        <span class="asset-name">${asset.name}</span>
        <span class="asset-type">${asset.type}</span>
        <span class="asset-impurity">Impurity: ${(asset.impurityRatio * 100).toFixed(0)}%</span>
        ${complianceScore != null ? `<span class="asset-compliance" style="color:${complianceColor(complianceScore)}">Compliance: ${(complianceScore * 100).toFixed(0)}%</span>` : ''}
      </div>
      <div class="chart-wrap">
        <canvas data-asset="${asset.id}"></canvas>
      </div>
    `
    grid.appendChild(card)
    container.appendChild(grid)

    const canvas = card.querySelector('canvas')
    const visiblePrices = asset.prices.slice(0, gameData.quarterBoundaries[currentQuarter + 1])

    renderLineChart(canvas, visiblePrices, {
      color: impurityColor(asset.impurityRatio),
      boundaries,
      currentQuarter,
      quarterBoundaries: gameData.quarterBoundaries,
      events: gameData.events || [],
    })

    const scrubberContainer = card.querySelector('.chart-wrap')
    renderLineChartScrubber(scrubberContainer, asset.prices, {
      color: impurityColor(asset.impurityRatio),
      boundaries,
      currentQuarter,
      quarterBoundaries: gameData.quarterBoundaries,
      events: gameData.events || [],
    })
  })
}

function complianceColor(score) {
  if (score >= 0.95) return '#4ade80'
  if (score >= 0.8) return '#facc15'
  return '#ef4444'
}

function impurityColor(ratio) {
  if (ratio === 0) return '#4ade80'
  if (ratio < 0.03) return '#a3e635'
  if (ratio < 0.06) return '#facc15'
  return '#ef4444'
}
