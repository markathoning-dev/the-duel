export function createCountdown(container, duration, onTick, onExpire) {
  container.innerHTML = `
    <div class="countdown">
      <div class="countdown-bar">
        <div class="countdown-fill" id="countdown-fill"></div>
      </div>
      <span class="countdown-text" id="countdown-text">${duration}s</span>
    </div>
  `

  const fill = container.querySelector('#countdown-fill')
  const text = container.querySelector('#countdown-text')
  let remaining = duration

  function update(seconds) {
    remaining = seconds
    const pct = (seconds / duration) * 100
    fill.style.width = pct + '%'
    text.textContent = seconds + 's'
    fill.style.background = seconds <= 10 ? 'var(--danger)' : seconds <= 20 ? 'var(--warn)' : 'var(--accent)'
    if (onTick) onTick(seconds)
  }

  update(duration)

  return { update }
}
