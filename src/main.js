import './styles/main.css'
import { createLobbyScreen } from './ui/lobby.js'
import { createDashboard } from './ui/dashboard.js'
import { createAllocator } from './ui/allocator.js'
import { createCountdown } from './ui/countdown.js'
import { createPortfolioMeter } from './ui/portfolio-meter.js'
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
let portfolioMeter
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
      <div class="game-header" id="game-header"></div>
      <div class="game-main">
        <div class="dash-panel" id="dash-panel"></div>
        <div class="command-panel" id="command-panel"></div>
      </div>
    </div>
  `
}

function renderTurn() {
  const state = engine.getState()
  const header = document.getElementById('game-header')
  const dashPanel = document.getElementById('dash-panel')
  const commandPanel = document.getElementById('command-panel')
  const local = state.players.local
  const opponent = state.players.opponent

  // Header
  header.innerHTML = `
    <div class="gh-player">
      <span class="gh-player-name">${local.name}</span>
      <span class="gh-player-badge">You</span>
      <span class="gh-capital-label">Cap</span>
      <span class="gh-capital" id="gh-capital">$${Math.round(local.capital).toLocaleString()}</span>
    </div>
    <div class="gh-center">
      <div class="gh-quarter">
        Quarter
        <span class="gh-quarter-num" id="gh-quarter-num">${state.currentQuarter + 1}</span>
      </div>
      <span class="gh-vs">⚔ vs</span>
      <div class="gh-quarter" style="color:var(--text-muted)">
        <span id="gh-opponent-header">${opponent.name}</span>
        <span class="gh-difficulty">${botDifficulty}</span>
      </div>
    </div>
    <div class="gh-opponent">
      <span class="gh-player-name">${opponent.name}</span>
      <span class="gh-difficulty">${botDifficulty}</span>
    </div>
  `

  // Command panel
  commandPanel.innerHTML = `
    <div class="cp-section">
      <div class="cp-label">Portfolio</div>
      <div id="portfolio-meter-container"></div>
    </div>
    <div class="cp-section">
      <div class="cp-label">Time</div>
      <div id="countdown-container"></div>
    </div>
    <div class="cp-section" style="flex:1;overflow-y:auto">
      <div class="allocator-header">
        <h3>Allocate</h3>
      </div>
      <div id="allocator-container"></div>
    </div>
  `

  const pmContainer = document.getElementById('portfolio-meter-container')
  portfolioMeter = createPortfolioMeter(pmContainer, localPlayerId, engine)
  portfolioMeter.update(state)

  const countdownContainer = document.getElementById('countdown-container')
  countdownControl = createCountdown(countdownContainer, state.isRebalancing ? 30 : state.turnDuration)

  const allocContainer = document.getElementById('allocator-container')
  const lastAlloc = local.allocations[local.allocations.length - 1] || {}

  if (state.isRebalancing) {
    createAllocator(allocContainer, state.gameData.assets, lastAlloc, (allocation) => {
      engine.submitRebalance(localPlayerId, allocation)
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

  engine.on('tick', (data) => {
    if (portfolioMeter) {
      portfolioMeter.update(engine.getState())
    }
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
