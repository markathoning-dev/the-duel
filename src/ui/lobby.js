export function createLobbyScreen(container, onStartGame) {
  container.innerHTML = `
    <div class="lobby">
      <div class="lobby-header">
        <h1>The Duel</h1>
        <p class="subtitle">Sharia-Compliant Investing Battle</p>
      </div>
      <div class="lobby-form">
        <div class="field">
          <label for="player-name">Your Name</label>
          <input type="text" id="player-name" maxlength="20" placeholder="Enter your name" autocomplete="off">
        </div>

        <div class="field">
          <label for="difficulty">Opponent Skill</label>
          <select id="difficulty">
            <option value="easy">Easy — Conservative & Random</option>
            <option value="normal" selected>Normal — Balanced Strategy</option>
            <option value="hard">Hard — Aggressive & Calculated</option>
          </select>
        </div>

        <button id="btn-start-duel" class="btn btn-primary" disabled>Start Duel</button>
      </div>
      <div id="lobby-status" class="lobby-status hidden"></div>
    </div>
  `

  const nameInput = container.querySelector('#player-name')
  const diffSelect = container.querySelector('#difficulty')
  const startBtn = container.querySelector('#btn-start-duel')
  const statusEl = container.querySelector('#lobby-status')

  function checkName() {
    startBtn.disabled = !nameInput.value.trim()
  }
  nameInput.addEventListener('input', checkName)
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !startBtn.disabled) startBtn.click()
  })

  startBtn.addEventListener('click', () => {
    const name = nameInput.value.trim()
    if (!name) {
      showStatus('Enter your name', true)
      return
    }
    const difficulty = diffSelect.value
    showStatus('Loading market data...', false)
    onStartGame(name, difficulty)
  })

  function showStatus(msg, isError) {
    statusEl.textContent = msg
    statusEl.className = 'lobby-status' + (isError ? ' error' : '')
    statusEl.classList.remove('hidden')
  }

  nameInput.focus()
}
