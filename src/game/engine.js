import {
  createInitialState,
  createPlayerState,
  getPricesAtQuarter,
  processAllocation,
  evaluateQuarter,
  computeFinalScores,
  determineWinner,
} from './state.js'

export function createGameEngine(gameData, localId, localName, opts = {}) {
  const state = createInitialState(gameData)
  state.turnDuration = opts.turnDuration || 60
  const listeners = {}

  function emit(event, data) {
    ;(listeners[event] || []).forEach(fn => fn(data))
  }

  function on(event, fn) {
    ;(listeners[event] ||= []).push(fn)
    return () => {
      listeners[event] = listeners[event].filter(f => f !== fn)
    }
  }

  function getState() {
    return state
  }

  function getCurrentPrices() {
    return getPricesAtQuarter(state.gameData, state.currentQuarter)
  }

  function startQuarter() {
    const q = state.currentQuarter
    state.phase = `quarter-${q + 1}`
    state.turnTimeRemaining = state.turnDuration
    state.submittedThisTurn = {}

    emit('quarter-start', { quarter: q, prices: getCurrentPrices() })

    state.timerId = setInterval(() => {
      state.turnTimeRemaining--
      emit('timer-tick', state.turnTimeRemaining)
      if (state.turnTimeRemaining <= 0) {
        endQuarter()
      }
    }, 1000)
  }

  function endQuarter() {
    clearInterval(state.timerId)
    state.timerId = null

    const playerIds = Object.keys(state.players).filter(
      id => id !== 'local' && id !== 'opponent'
    )
    const missing = playerIds.filter(pid => !state.submittedThisTurn[pid])
    for (const pid of missing) {
      processAllocation(state, pid, {})
    }

    evaluateQuarter(state)

    if (state.currentQuarter >= 3) {
      computeFinalScores(state)
      state.winner = determineWinner(state)
      state.phase = 'results'
      emit('game-over', {
        players: state.players,
        winner: state.winner,
      })
    } else {
      emit('quarter-end', {
        quarter: state.currentQuarter,
        prices: getPricesAtQuarter(state.gameData, state.currentQuarter + 1),
      })
      state.currentQuarter++
      startQuarter()
    }
  }

  function submitAllocation(playerId, allocation) {
    if (state.submittedThisTurn[playerId]) return
    state.submittedThisTurn[playerId] = true
    processAllocation(state, playerId, allocation)
    emit('allocation-submitted', { playerId, allocation })

    const playerIds = Object.keys(state.players).filter(
      id => id !== 'local' && id !== 'opponent'
    )
    const allSubmitted = playerIds.every(pid => state.submittedThisTurn[pid])
    if (allSubmitted) {
      endQuarter()
    }
  }

  function joinOpponent(id, name) {
    if (state.players.opponent) return
    const local = createPlayerState(localId, localName)
    const opponent = createPlayerState(id, name)
    state.players.local = local
    state.players.opponent = opponent
    state.players[localId] = local
    state.players[id] = opponent
    startQuarter()
  }

  function triggerRebalance(event) {
    state.isRebalancing = true
    state.rebalanceSeconds = 30
    state.rebalanceEvent = event
    state.submittedThisTurn = {}

    emit('rebalance-start', { event, seconds: 30 })

    if (state.rebalanceTimerId) clearInterval(state.rebalanceTimerId)
    state.rebalanceTimerId = setInterval(() => {
      state.rebalanceSeconds--
      emit('rebalance-tick', state.rebalanceSeconds)
      if (state.rebalanceSeconds <= 0) {
        clearInterval(state.rebalanceTimerId)
        state.rebalanceTimerId = null
        state.isRebalancing = false
        emit('rebalance-end', {})
      }
    }, 1000)
  }

  function submitRebalance(playerId, allocation) {
    if (!state.isRebalancing) return
    if (state.submittedThisTurn[playerId]) return
    state.submittedThisTurn[playerId] = true
    processAllocation(state, playerId, allocation)
    emit('allocation-submitted', { playerId, allocation })

    const playerIds = Object.keys(state.players).filter(
      id => id !== 'local' && id !== 'opponent'
    )
    const allSubmitted = playerIds.every(pid => state.submittedThisTurn[pid])
    if (allSubmitted) {
      clearInterval(state.rebalanceTimerId)
      state.rebalanceTimerId = null
      state.isRebalancing = false
      emit('rebalance-end', {})
    }
  }

  return {
    on,
    getState,
    getCurrentPrices,
    submitAllocation,
    submitRebalance,
    triggerRebalance,
    joinOpponent,
  }
}
