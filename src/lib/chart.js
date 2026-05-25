let _animationFrame = null

export function renderLineChart(canvas, prices, options = {}) {
  if (_animationFrame) {
    cancelAnimationFrame(_animationFrame)
    _animationFrame = null
  }

  const ctx = canvas.getContext('2d')
  const rect = canvas.parentElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const width = rect.width
  const height = options.height || 80

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.scale(dpr, dpr)

  const pad = { top: 6, right: 4, bottom: 12, left: 32 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  if (!prices || prices.length < 2) return

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const draw = (progress) => {
    ctx.clearRect(0, 0, width, height)

    // Grid lines
    ctx.strokeStyle = 'rgba(26, 47, 56, 0.4)'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      const y = pad.top + (chartH / 2) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(width - pad.right, y)
      ctx.stroke()
    }

    // Y-axis labels
    ctx.fillStyle = '#3d555e'
    ctx.font = '8px DM Mono, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < 3; i++) {
      const val = max - (range / 2) * i
      const y = pad.top + (chartH / 2) * i
      ctx.fillText(val.toFixed(0), pad.left - 4, y)
    }

    const color = options.color || '#c8a45e'

    // Parse RGB for gradient
    let r = 200, g = 164, b = 94
    if (color === '#4ecb8d' || color === '#a3e635') { r = 78; g = 203; b = 141 }
    else if (color === '#facc15' || color === '#e0a84c') { r = 224; g = 168; b = 76 }
    else if (color === '#ef4444') { r = 212; g = 96; b = 90 }

    const gradient = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom)
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.01)`)

    // Quarter boundaries
    if (options.boundaries) {
      ctx.strokeStyle = 'rgba(200, 164, 94, 0.08)'
      ctx.setLineDash([2, 3])
      options.boundaries.forEach(b => {
        const idx = Math.min(b, prices.length - 1)
        const x = pad.left + (idx / (prices.length - 1)) * chartW
        ctx.beginPath()
        ctx.moveTo(x, pad.top)
        ctx.lineTo(x, height - pad.bottom)
        ctx.stroke()
      })
      ctx.setLineDash([])
    }

    // Current quarter marker
    if (options.currentQuarter != null && options.currentQuarter > 0) {
      const x = pad.left + (options.quarterBoundaries[options.currentQuarter] / (prices.length - 1)) * chartW
      ctx.strokeStyle = 'rgba(200, 164, 94, 0.1)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, height - pad.bottom)
      ctx.stroke()
    }

    const drawCount = Math.max(2, Math.floor(prices.length * progress))

    // Draw filled area
    ctx.beginPath()
    for (let i = 0; i < drawCount; i++) {
      const x = pad.left + (i / (prices.length - 1)) * chartW
      const y = pad.top + chartH - ((prices[i] - min) / range) * chartH
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    const lastX = pad.left + ((drawCount - 1) / (prices.length - 1)) * chartW
    const lastY = pad.top + chartH - ((prices[drawCount - 1] - min) / range) * chartH
    ctx.lineTo(lastX, height - pad.bottom)
    ctx.lineTo(pad.left, height - pad.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Line with glow
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 6
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    for (let i = 0; i < drawCount; i++) {
      const x = pad.left + (i / (prices.length - 1)) * chartW
      const y = pad.top + chartH - ((prices[i] - min) / range) * chartH
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    // Crisp line
    ctx.beginPath()
    for (let i = 0; i < drawCount; i++) {
      const x = pad.left + (i / (prices.length - 1)) * chartW
      const y = pad.top + chartH - ((prices[i] - min) / range) * chartH
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    // End dot
    if (drawCount > 0) {
      const endX = pad.left + ((drawCount - 1) / (prices.length - 1)) * chartW
      const endY = pad.top + chartH - ((prices[drawCount - 1] - min) / range) * chartH
      ctx.beginPath()
      ctx.arc(endX, endY, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#04080a'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  if (options.animate === false) {
    draw(1)
    return
  }

  const duration = 400
  const start = performance.now()

  function frame(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    draw(eased)
    if (progress < 1) {
      _animationFrame = requestAnimationFrame(frame)
    } else {
      _animationFrame = null
      draw(1)
    }
  }

  _animationFrame = requestAnimationFrame(frame)
}

export function renderLineChartScrubber(container, prices, options = {}) {
  const wrapper = document.createElement('div')
  wrapper.className = 'chart-scrubber'

  const playBtn = document.createElement('button')
  playBtn.className = 'scrubber-play-btn'
  playBtn.textContent = '\u25B6'
  playBtn.title = 'Play / Pause'

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.className = 'scrubber-slider'
  slider.min = 0
  slider.max = prices.length - 1
  slider.value = prices.length - 1

  wrapper.appendChild(playBtn)
  wrapper.appendChild(slider)
  container.appendChild(wrapper)

  const canvas = container.querySelector('canvas')
  let isPlaying = false
  let playInterval = null

  function updateChart(index) {
    const visiblePrices = prices.slice(0, parseInt(index) + 1)
    renderLineChart(canvas, visiblePrices, { ...options, animate: false })
  }

  slider.addEventListener('input', () => {
    if (isPlaying) togglePlay()
    updateChart(slider.value)
  })

  function togglePlay() {
    isPlaying = !isPlaying
    playBtn.textContent = isPlaying ? '\u23F8' : '\u25B6'
    if (isPlaying) {
      if (parseInt(slider.value) >= prices.length - 1) slider.value = 0
      playInterval = setInterval(() => {
        const next = parseInt(slider.value) + 1
        if (next >= prices.length) {
          togglePlay()
          return
        }
        slider.value = next
        updateChart(next)
      }, 1000 / 60)
    } else {
      clearInterval(playInterval)
      playInterval = null
    }
  }

  playBtn.addEventListener('click', togglePlay)
}
