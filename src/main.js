import './styles/main.css'
import { createLobbyScreen } from './ui/lobby.js'
import { createDashboard } from './ui/dashboard.js'
import { createAllocator } from './ui/allocator.js'
import { createCountdown } from './ui/countdown.js'
import { createResultsScreen } from './ui/results.js'
import { showRecap } from './ui/recap.js'
import { createGameEngine } from './game/engine.js'
import { loadGameSeed } from './game/data-loader.js'
import { setupHost, setupGuest, send } from './multiplayer/sync.js'
import { disconnect } from './multiplayer/peer.js'
import { showOnboarding } from './ui/onboarding.js'
import { renderSpectatorDashboard, isSpectator, getSpectateCode } from './ui/spectator.js'
import { playTick, playConfirm, playAlert, playVictory } from './lib/sound.js'

const SCREENS = ['lobby', 'game', 'results']

let engine
let countdownControl
let isHost = false
let localPlayerId = 'p1'
let opponentPlayerId = 'p2'

function showScreen(name) {
  SCREENS.forEach(s => {
    document.getElementById(`screen-${s}`).classList.toggle('active', s === name)
  })
}

function buildGameScreen() {
  const container = document.getElementById('screen-game')
  container.innerHTML = `
    <div class="game-layout">
      <div class="dash-panel" id="dash-panel"></div>
      <div class="side-panel" id="side-panel"></div>
    </div>
  `
}

function renderTurn() {
  const state = engine.getState()
  const sidePanel = document.getElementById('side-panel')
  const dashPanel = document.getElementById('dash-panel')
  const local = state.players.local
  const opponent = state.players.opponent

  sidePanel.innerHTML = `
    <div class="turn-info">
      <div>
        <span class="player-name">${local.name}</span>
        <span class="capital">$${Math.round(local.capital).toLocaleString()}</span>
      </div>
      <div style="text-align:right;font-size:0.8rem;color:var(--text-muted)">
        vs ${opponent.name}
      </div>
    </div>
    <div id="countdown-container"></div>
    <div id="allocator-container"></div>
  `

  const countdownContainer = document.getElementById('countdown-container')
  countdownControl = createCountdown(countdownContainer, state.isRebalancing ? 30 : state.turnDuration)

  const allocContainer = document.getElementById('allocator-container')
  const lastAlloc = local.allocations[local.allocations.length - 1] || {}

  if (state.isRebalancing) {
    createAllocator(allocContainer, state.gameData.assets, lastAlloc, (allocation) => {
      engine.submitRebalance(localPlayerId, allocation)
      send({ type: 'rebalance', allocation, quarter: state.currentQuarter })
    }, { isRebalance: true })
  } else {
    createAllocator(allocContainer, state.gameData.assets, lastAlloc, (allocation) => {
      engine.submitAllocation(localPlayerId, allocation)
      send({ type: 'allocation', allocation, quarter: state.currentQuarter })
    })
  }

  createDashboard(dashPanel, state.gameData, state.currentQuarter)
}

function renderResults() {
  const container = document.getElementById('screen-results')
  const state = engine.getState()
  createResultsScreen(container, state, () => {
    disconnect()
    showScreen('lobby')
  })
}

async function startGameHost(playerName) {
  isHost = true
  localPlayerId = 'p1'
  opponentPlayerId = 'p2'

  const gameData = await loadGameSeed()
  engine = createGameEngine(gameData, localPlayerId, playerName, { turnDuration: 60 })

  const roomCode = await setupHost((data) => {
    if (data.type === 'join') {
      engine.joinOpponent(opponentPlayerId, data.name)
      send({ type: 'game-start', gameData: engine.getState().gameData, hostName: playerName })
      buildGameScreen()
      showScreen('game')
      renderTurn()
    }
    if (data.type === 'allocation') {
      engine.submitAllocation(opponentPlayerId, data.allocation)
    }
    if (data.type === 'rebalance') {
      engine.submitRebalance(opponentPlayerId, data.allocation)
    }
  }, () => {})

  return roomCode
}

async function startGameGuest(playerName, code) {
  isHost = false
  localPlayerId = 'p2'
  opponentPlayerId = 'p1'

  await setupGuest(code, (data) => {
    if (data.type === 'game-start') {
      engine = createGameEngine(data.gameData, localPlayerId, playerName, { turnDuration: 60 })
      engine.joinOpponent(opponentPlayerId, data.hostName)
      buildGameScreen()
      showScreen('game')
      renderTurn()
    }
  })

  send({ type: 'join', name: playerName })
}

function wireEngine() {
  engine.on('timer-tick', (seconds) => {
    if (countdownControl) countdownControl.update(seconds)
    if (seconds <= 10 && seconds > 0) playTick()
  })

  engine.on('quarter-end', async () => {
    const state = engine.getState()
    const recapContainer = document.getElementById('screen-game')
    await showRecap(recapContainer, state)
    renderTurn()
  })

  engine.on('allocation-submitted', () => {
    const btn = document.querySelector('.allocator .btn')
    if (btn) btn.disabled = true
    playConfirm()
  })

  engine.on('rebalance-start', () => {
    playAlert()
    renderTurn()
  })

  engine.on('rebalance-end', () => {
    renderTurn()
  })

  engine.on('rebalance-tick', (seconds) => {
    if (countdownControl) countdownControl.update(seconds)
  })

  engine.on('game-over', () => {
    playVictory()
    if (isHost) {
      const state = engine.getState()
      send({ type: 'game-over', state: {
        players: {
          local: { name: state.players.local.name, capital: state.players.local.capital, totalReturn: state.players.local.totalReturn, portfolioImpurity: state.players.local.portfolioImpurity, score: state.players.local.score },
          opponent: { name: state.players.opponent.name, capital: state.players.opponent.capital, totalReturn: state.players.opponent.totalReturn, portfolioImpurity: state.players.opponent.portfolioImpurity, score: state.players.opponent.score },
        },
        winner: state.winner,
      }})
    }
    renderResults()
    showScreen('results')
  })

  if (!isHost) {
    const origRenderResults = renderResults
    const origRenderTurn = renderTurn
    engine.on('quarter-start', () => {})
  }
}

async function startGame(playerName, roomCode, role) {
  if (isSpectator()) {
    const code = getSpectateCode()
    console.log('Spectator mode: watching room', code)
  }

  try {
    if (role === 'host') {
      const code = await startGameHost(playerName)

      const app = document.getElementById('app')
      const statusEl = document.createElement('div')
      statusEl.style.cssText = 'position:fixed;top:1rem;right:1rem;background:var(--surface);border:1px solid var(--accent-dim);border-radius:8px;padding:0.75rem 1rem;font-size:0.85rem;z-index:100'
      statusEl.innerHTML = `Room: <strong style="color:var(--accent);letter-spacing:0.1em">${code}</strong>`
      app.appendChild(statusEl)
    } else {
      await startGameGuest(playerName, roomCode)
    }

    wireEngine()
  } catch (err) {
    console.error('Failed to start game:', err)
    alert('Failed to connect. Check the room code and try again.')
  }
}

function init() {
  const app = document.getElementById('app')
  SCREENS.forEach(s => {
    const div = document.createElement('div')
    div.id = `screen-${s}`
    div.className = `screen${s === 'lobby' ? ' active' : ''}`
    app.appendChild(div)
  })

  const lobbyContainer = document.getElementById('screen-lobby')
  createLobbyScreen(lobbyContainer, (playerName, roomCode, role) => {
    startGame(playerName, roomCode, role)
  })

  showOnboarding(app)
}

document.addEventListener('DOMContentLoaded', init)
