let ctx = null

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

export function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const c = getContext()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + duration)
  } catch {
    // Audio not available — silently ignore
  }
}

export function playTick() { playTone(800, 0.05, 'sine', 0.15) }
export function playConfirm() { playTone(523, 0.15, 'triangle', 0.2) }
export function playAlert() { playTone(440, 0.3, 'sawtooth', 0.2) }
export function playVictory() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sine', 0.25), i * 150))
}
