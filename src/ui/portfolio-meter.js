export function createPortfolioMeter(container, playerId, engine) {
  const meter = document.createElement('div'); meter.className = 'portfolio-meter'
  meter.innerHTML = `
    <div class="pm-capital-row">
      <span class="pm-capital-label">Capital</span>
      <span class="pm-capital-value" id="pm-capital">$100,000</span>
    </div>
    <div class="pm-stats">
      <div class="pm-stat"><span class="pm-stat-label">Return</span><span class="pm-stat-value" id="pm-return">0.00%</span></div>
      <div class="pm-stat"><span class="pm-stat-label">Impurity</span><span class="pm-stat-value" id="pm-impurity">0.00%</span></div>
      <div class="pm-stat"><span class="pm-stat-label">Allocated</span><span class="pm-stat-value" id="pm-allocated">0%</span></div>
      <div class="pm-stat"><span class="pm-stat-label">Volatility</span><span class="pm-stat-value" id="pm-volatility">--</span></div>
    </div>
    <div class="pm-bar-wrap">
      <div class="pm-bar-label"><span>Allocated</span><span id="pm-alloc-pct">0%</span></div>
      <div class="pm-bar"><div class="pm-bar-fill" id="pm-bar-fill" style="width:0%"></div></div>
    </div>
  `
  container.appendChild(meter)
  return {
    update(state) {
      const player = state.players[playerId]; if (!player) return
      const capEl = meter.querySelector('#pm-capital'); const retEl = meter.querySelector('#pm-return')
      const impEl = meter.querySelector('#pm-impurity'); const allEl = meter.querySelector('#pm-allocated')
      const volEl = meter.querySelector('#pm-volatility'); const barFill = meter.querySelector('#pm-bar-fill')
      const allocPct = meter.querySelector('#pm-alloc-pct')
      capEl.textContent = `$${Math.round(player.capital).toLocaleString()}`
      const ghCapital = document.getElementById('gh-capital')
      if (ghCapital) ghCapital.textContent = `$${Math.round(player.capital).toLocaleString()}`
      const ret = player.initialCapital > 0 ? (player.capital - player.initialCapital) / player.initialCapital : 0
      retEl.textContent = `${(ret * 100).toFixed(2)}%`; retEl.className = 'pm-stat-value ' + (ret >= 0 ? 'positive' : 'negative')
      const totalAlloc = Object.values(player.currentAllocation).reduce((s, v) => s + v, 0)
      allEl.textContent = `${(totalAlloc * 100).toFixed(0)}%`
      const pct = Math.round(totalAlloc * 100)
      if (barFill) barFill.style.width = Math.min(pct, 100) + '%'; if (allocPct) allocPct.textContent = Math.min(pct, 100) + '%'
      const impurity = computeCurrentImpurity(player.currentAllocation, state.gameData.assets)
      impEl.textContent = `${(impurity * 100).toFixed(2)}%`; impEl.className = 'pm-stat-value'
      if (impurity > 0.05) impEl.classList.add('negative')
      else if (impurity > 0.02) impEl.style.color = 'var(--turquoise)'
      else impEl.style.color = ''
      const vol = estimateVolatility(state); volEl.textContent = vol !== null ? `${vol.toFixed(1)}%` : '--'
      meter.classList.toggle('pm-impurity-warn', impurity > 0.03)
    },
  }
}

function computeCurrentImpurity(allocation, assets) {
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]))
  const totalAlloc = Object.values(allocation).reduce((s, v) => s + v, 0)
  if (totalAlloc === 0) return 0
  return Object.entries(allocation).reduce((sum, [id, frac]) => sum + frac * (assetMap[id]?.impurityRatio || 0), 0) / totalAlloc
}

function estimateVolatility(state) {
  if (!state.quarterPrices) return null; const samples = []
  for (const [, priceArray] of Object.entries(state.quarterPrices)) {
    if (priceArray.length > 1) {
      const recent = priceArray.slice(Math.max(0, state.tickNumber - 10), state.tickNumber)
      if (recent.length > 1) {
        let sumSq = 0; for (let i = 1; i < recent.length; i++) { const ret = (recent[i] - recent[i - 1]) / recent[i - 1]; sumSq += ret * ret }
        samples.push(Math.sqrt(sumSq / (recent.length - 1)) * 100)
      }
    }
  }
  if (samples.length === 0) return null
  return samples.reduce((s, v) => s + v, 0) / samples.length
}
