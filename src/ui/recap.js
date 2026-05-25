const ROMAN = ['I', 'II', 'III', 'IV']

export function showRecap(container, state) {
  const quarter = state.currentQuarter; const events = state.gameData.events || []
  const quarterEvents = events.filter(e => e.quarter === quarter); const assets = state.gameData.assets
  const local = state.players.local; const opponent = state.players.opponent
  const localAlloc = local.allocations[local.allocations.length - 1] || {}
  const opponentAlloc = opponent.allocations[opponent.allocations.length - 1] || {}

  container.innerHTML = `
    <div class="recap-overlay">
      <div class="recap-card">
        <h2 class="recap-title">Quarter ${ROMAN[quarter]} — Account of Events</h2>
        <p class="recap-subtitle">The royal ledger records what has passed</p>
        <div class="recap-divider"></div>
        <div class="recap-section"><h3>Events</h3>
          <div class="recap-events">${quarterEvents.length > 0 ? quarterEvents.map(e => `
            <div class="recap-event">
              <span class="recap-event-icon">${eventIcon(e.type)}</span>
              <span class="recap-event-text">${e.description}</span>
            </div>`).join('') : '<p class="recap-no-events">No major events this quarter</p>'}
          </div>
        </div>
        <div class="recap-divider"></div>
        <div class="recap-section"><h3>Asset Performance This Quarter</h3>
          <div class="recap-assets">${assets.map(a => {
            const startIdx = state.gameData.quarterBoundaries[quarter]
            const endIdx = state.gameData.quarterBoundaries[quarter + 1]
            const startPrice = a.prices[startIdx]; const endPrice = a.prices[endIdx]
            const perf = (endPrice - startPrice) / startPrice
            return `<div class="recap-asset"><span class="recap-asset-name">${a.name}</span>
              <span class="recap-asset-perf ${perf >= 0 ? 'positive' : 'negative'}">${perf >= 0 ? '+' : ''}${(perf * 100).toFixed(1)}%</span>
              <span class="recap-asset-impurity">${(a.impurityRatio * 100).toFixed(0)}% imp.</span></div>`
          }).join('')}</div>
        </div>
        <div class="recap-divider"></div>
        <div class="recap-section"><h3>Player Positions</h3>
          <div class="recap-players">
            <div class="recap-player"><div class="recap-player-name">${local.name}</div>
              <div class="recap-player-capital">$${Math.round(local.capital).toLocaleString()}</div>
              <div class="recap-player-alloc">${Object.entries(localAlloc).filter(([k]) => k !== 'cash').map(([id, pct]) => `${id}: ${(pct * 100).toFixed(0)}%`).join(' | ')}${localAlloc.cash ? ` | Cash: ${(localAlloc.cash * 100).toFixed(0)}%` : ''}</div>
            </div>
            <div class="recap-vs"><span>\u2694</span><span>VS</span></div>
            <div class="recap-player"><div class="recap-player-name">${opponent.name}</div>
              <div class="recap-player-capital">$${Math.round(opponent.capital).toLocaleString()}</div>
              <div class="recap-player-alloc">${Object.entries(opponentAlloc).filter(([k]) => k !== 'cash').map(([id, pct]) => `${id}: ${(pct * 100).toFixed(0)}%`).join(' | ')}${opponentAlloc.cash ? ` | Cash: ${(opponentAlloc.cash * 100).toFixed(0)}%` : ''}</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" id="recap-continue" style="width:100%;margin-top:0.5rem">Proceed to Next Quarter</button>
      </div>
    </div>`

  return new Promise((resolve) => {
    container.querySelector('#recap-continue').onclick = () => { container.innerHTML = ''; resolve() }
  })
}

function eventIcon(type) {
  const icons = { rate_decision: '\u{1F3E6}', sector_shock: '\u26A1', regulatory_change: '\u2696\uFE0F' }
  return icons[type] || '\u{1F4E2}'
}
