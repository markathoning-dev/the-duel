export function createResultsScreen(container, state, onPlayAgain) {
  const local = state.players.local; const opponent = state.players.opponent; const winner = state.winner
  container.innerHTML = `
    <div class="results">
      <div class="results-header">
        <h1>The Duel is Decided</h1>
        <div class="winner-banner">${winner === 'draw' ? "It's a draw!" : `${winner === local.id ? local.name : opponent.name} wins!`}</div>
      </div>
      <div class="results-grid">
        <div class="result-card ${winner === local.id ? 'winner' : ''}">
          <h3>${local.name}</h3>
          <div class="stat"><span class="stat-label">Total Return</span><span class="stat-value ${local.totalReturn >= 0 ? 'positive' : 'negative'}">${(local.totalReturn * 100).toFixed(2)}%</span></div>
          <div class="stat"><span class="stat-label">Portfolio Impurity</span><span class="stat-value">${(local.portfolioImpurity * 100).toFixed(2)}%</span></div>
          <div class="stat"><span class="stat-label">Purity-Adjusted Return</span><span class="stat-value highlight">${(local.score * 100).toFixed(2)}%</span></div>
          <div class="stat"><span class="stat-label">Final Capital</span><span class="stat-value">$${Math.round(local.capital).toLocaleString()}</span></div>
        </div>
        <div class="result-card ${winner === opponent.id ? 'winner' : ''}">
          <h3>${opponent.name}</h3>
          <div class="stat"><span class="stat-label">Total Return</span><span class="stat-value ${opponent.totalReturn >= 0 ? 'positive' : 'negative'}">${(opponent.totalReturn * 100).toFixed(2)}%</span></div>
          <div class="stat"><span class="stat-label">Portfolio Impurity</span><span class="stat-value">${(opponent.portfolioImpurity * 100).toFixed(2)}%</span></div>
          <div class="stat"><span class="stat-label">Purity-Adjusted Return</span><span class="stat-value highlight">${(opponent.score * 100).toFixed(2)}%</span></div>
          <div class="stat"><span class="stat-label">Final Capital</span><span class="stat-value">$${Math.round(opponent.capital).toLocaleString()}</span></div>
        </div>
      </div>
      <button class="btn btn-primary" id="btn-play-again">Play Again</button>
    </div>
  `
  container.querySelector('#btn-play-again').addEventListener('click', onPlayAgain)
}
