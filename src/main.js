import './styles/main.css'
import { createLobbyScreen } from './ui/lobby.js'
import { createDashboard } from './ui/dashboard.js'
import { createAllocator } from './ui/allocator.js'
import { createCountdown } from './ui/countdown.js'
import { createResultsScreen } from './ui/results.js'
import { showRecap } from './ui/recap.js'
import { createGameEngine } from './game/engine.js'
import { loadGameSeed } from './game/data-loader.js'
import { createBot } from './game/bot.js'
import { showOnboarding } from './ui/onboarding.js'
import { renderSpectatorDashboard, isSpectator, getSpectateCode } from './ui/spectator.js'
import { playTick, playConfirm, playAlert, playVictory } from './lib/sound.js'

const SCREENS = ['lobby', 'game', 'results']

let engine
let countdownControl
let bot
let localPlayerId = 'p1'
let opponentPlayerId = 'p2'
let botDifficulty = 'normal'

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
        vs ${opponent.name} (${botDifficulty})
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
      // Bot auto-submits rebalance too
      setTimeout(() => {
        if (bot) {
          const botAlloc = bot.makeDecision(state)
          engine.submitRebalance(opponentPlayerId, botAlloc)
        }
      }, 1500)
    }, { isRebalance: true })
  } else {
    createAllocator(allocContainer, state.gameData.assets, lastAlloc, (allocation) => {
      engine.submitAllocation(localPlayerId, allocation)
    })
  }

  createDashboard(dashPanel, state.gameData, state.currentQuarter)
}

function renderResults() {
  const container = document.getElementById('screen-results')
  const state = engine.getState()
  createResultsScreen(container, state, () => {
    showScreen('lobby')
  })
}

function wireEngine() {
  engine.on('timer-tick', (seconds) => {
    if (countdownControl) countdownControl.update(seconds)
    if (seconds <= 10 && seconds > 0) playTick()
  })

  engine.on('quarter-start', () => {
    // Bot makes its decision shortly after each quarter starts
    setTimeout(() => {
      if (!bot) return
      const state = engine.getState()
      const botAlloc = bot.makeDecision(state)
      if (state.isRebalancing) {
        engine.submitRebalance(opponentPlayerId, botAlloc)
      } else {
        engine.submitAllocation(opponentPlayerId, botAlloc)
      }
    }, 2000)
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
    renderResults()
    showScreen('results')
  })
}

async function startDuel(playerName, difficulty) {
  try {
    botDifficulty = difficulty

    const gameData = await loadGameSeed()
    engine = createGameEngine(gameData, localPlayerId, playerName, { turnDuration: 60 })
    bot = createBot(gameData.assets, difficulty)

    engine.joinOpponent(opponentPlayerId, bot.getName())

    // Bot makes its first decision shortly after Q1 starts
    setTimeout(() => {
      if (!bot) return
      const state = engine.getState()
      const botAlloc = bot.makeDecision(state)
      engine.submitAllocation(opponentPlayerId, botAlloc)
    }, 2000)

    wireEngine()

    buildGameScreen()
    showScreen('game')
    renderTurn()
  } catch (err) {
    console.error('Failed to start duel:', err)
    alert(`Failed to start game: ${err.message || String(err)}`)
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
  createLobbyScreen(lobbyContainer, (playerName, difficulty) => {
    startDuel(playerName, difficulty)
  })

  showOnboarding(app)
}

document.addEventListener('DOMContentLoaded', init)