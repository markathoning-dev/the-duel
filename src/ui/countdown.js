export function createCountdown(container, duration, onTick, onExpire) {
  container.innerHTML = `
    <div class="countdown-section" id="countdown-section">
      <span class="countdown-label">Remaining</span>
      <div class="countdown-bar">
        <div class="countdown-fill" id="countdown-fill"></div>
      </div>
      <span class="countdown-text" id="countdown-text">${duration}s</span>
    </div>
  `

  const fill = container.querySelector('#countdown-fill')
  const text = container.querySelector('#countdown-text')
  const section = container.querySelector('#countdown-section')
  let remaining = duration

  function update(seconds) {
    remaining = seconds
    const pct = (seconds / duration) * 100
    fill.style.width = pct + '%'
    text.textContent = seconds + 's'

    section.classList.toggle('countdown-urgent', seconds <= 10)

    if (seconds <= 5) {
      fill.style.background = 'var(--red)'
      text.style.color = 'var(--red)'
    } else if (seconds <= 15) {
      fill.style.background = 'var(--turquoise)'
      text.style.color = 'var(--turquoise)'
    } else {
      fill.style.background = ''
      text.style.color = ''
    }
    if (onTick) onTick(seconds)
  }

  update(duration)

  return { update }
}
