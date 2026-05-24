export function createLobbyScreen(container, onGameStart) {
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
        <div class="lobby-actions">
          <button id="btn-create-room" class="btn btn-primary">Create Room</button>
          <div class="divider"><span>or</span></div>
          <div class="join-row">
            <input type="text" id="room-code" maxlength="8" placeholder="Room code" autocomplete="off">
            <button id="btn-join-room" class="btn btn-secondary">Join</button>
          </div>
          <div class="room-browser">
            <div class="divider"><span>or browse rooms</span></div>
            <div id="room-list" class="room-list">
              <p class="room-list-empty">No rooms available. Create one to start playing.</p>
            </div>
          </div>
        </div>
        <div id="room-code-display" class="room-code-display hidden">
          <p>Share this code with your opponent:</p>
          <div class="code" id="room-code-value"></div>
          <p class="waiting">Waiting for opponent to join...</p>
        </div>
        <div id="lobby-status" class="lobby-status hidden"></div>
      </div>
    </div>
  `

  const nameInput = container.querySelector('#player-name')
  const createBtn = container.querySelector('#btn-create-room')
  const roomCodeInput = container.querySelector('#room-code')
  const joinBtn = container.querySelector('#btn-join-room')
  const roomCodeDisplay = container.querySelector('#room-code-display')
  const roomCodeValue = container.querySelector('#room-code-value')
  const statusEl = container.querySelector('#lobby-status')

  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  function showStatus(msg, isError) {
    statusEl.textContent = msg
    statusEl.className = 'lobby-status' + (isError ? ' error' : '')
    statusEl.classList.remove('hidden')
  }

  createBtn.addEventListener('click', () => {
    const name = nameInput.value.trim()
    if (!name) { showStatus('Enter your name', true); return }
    const code = generateCode()
    roomCodeValue.textContent = code
    roomCodeDisplay.classList.remove('hidden')
    createBtn.disabled = true
    nameInput.disabled = true
    showStatus('Room created!')
    onGameStart(name, code, 'host')
  })

  joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim()
    const code = roomCodeInput.value.trim().toUpperCase()
    if (!name) { showStatus('Enter your name', true); return }
    if (!code) { showStatus('Enter a room code', true); return }
    onGameStart(name, code, 'guest')
  })

  roomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinBtn.click()
  })

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createBtn.click()
  })
}
