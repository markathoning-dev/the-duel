export function renderSpectatorDashboard(container, state) {
  container.innerHTML = `
    <div class="spectator-mode">
      <div class="spectator-badge">Spectator Mode</div>
      <div class="spectator-grid">
        <div class="spectator-player spectator-local">
          <h3>${state.players.local?.name || 'Player 1'}</h3>
          <div class="spectator-capital">$${Math.round(state.players.local?.capital || 0).toLocaleString()}</div>
          <div class="spectator-score">Score: ${(state.players.local?.score || 0).toFixed(4)}</div>
        </div>
        <div class="spectator-player spectator-opponent">
          <h3>${state.players.opponent?.name || 'Player 2'}</h3>
          <div class="spectator-capital">$${Math.round(state.players.opponent?.capital || 0).toLocaleString()}</div>
          <div class="spectator-score">Score: ${(state.players.opponent?.score || 0).toFixed(4)}</div>
        </div>
      </div>
      <div class="spectator-round">Quarter ${(state.currentQuarter || 0) + 1} of 4</div>
    </div>
  `
}

export function isSpectator() {
  const params = new URLSearchParams(window.location.search)
  return params.has('spectate')
}

export function getSpectateCode() {
  const params = new URLSearchParams(window.location.search)
  return params.get('spectate') || null
}
