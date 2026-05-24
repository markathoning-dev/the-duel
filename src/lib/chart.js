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
  const height = options.height || 120

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.scale(dpr, dpr)

  const pad = { top: 8, right: 8, bottom: 16, left: 40 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  if (!prices || prices.length < 2) return

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const draw = (progress) => {
    ctx.clearRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(42, 42, 58, 0.5)'
    ctx.lineWidth = 1
    for (let i = 0; i < 4; i++) {
      const y = pad.top + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(width - pad.right, y)
      ctx.stroke()
    }

    const color = options.color || '#4ade80'
    const gradient = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom)
    gradient.addColorStop(0, color + '33')
    gradient.addColorStop(1, color + '02')

    const drawCount = Math.max(2, Math.floor(prices.length * progress))

    ctx.beginPath()
    for (let i = 0; i < drawCount; i++) {
      const x = pad.left + (i / (prices.length - 1)) * chartW
      const y = pad.top + chartH - ((prices[i] - min) / range) * chartH
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    const lastX = pad.left + ((drawCount - 1) / (prices.length - 1)) * chartW
    const lastY = pad.top + chartH - ((prices[drawCount - 1] - min) / range) * chartH
    ctx.lineTo(lastX, height - pad.bottom)
    ctx.lineTo(pad.left, height - pad.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    if (options.boundaries) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'
      ctx.setLineDash([3, 3])
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

    if (options.events && options.quarterBoundaries) {
      options.events.forEach(e => {
        const dayIndex = options.quarterBoundaries[e.quarter]
        if (dayIndex == null || dayIndex >= prices.length) return
        const x = pad.left + (dayIndex / (prices.length - 1)) * chartW
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(x, pad.top)
        ctx.lineTo(x, height - pad.bottom)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#ef4444'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText('\u26A1', x, pad.top - 2)
      })
    }

    if (options.currentQuarter != null && options.currentQuarter > 0) {
      const x = pad.left + (options.quarterBoundaries[options.currentQuarter] / (prices.length - 1)) * chartW
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, height - pad.bottom)
      ctx.stroke()
    }

    ctx.fillStyle = '#8888a0'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < 4; i++) {
      const val = max - (range / 3) * i
      const y = pad.top + (chartH / 3) * i
      ctx.fillText(val.toFixed(0), pad.left - 6, y)
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
