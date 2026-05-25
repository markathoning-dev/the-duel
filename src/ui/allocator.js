export function createAllocator(container, assets, currentAllocation, onSubmit, options = {}) {
  container.innerHTML = ''
  const alloc = document.createElement('div'); alloc.className = 'allocator'
  const isRebalance = options.isRebalance || false
  const header = document.createElement('div'); header.className = 'allocator-header'
  header.innerHTML = `<h3>Allocate Your Capital</h3>`
  alloc.appendChild(header)
  const presets = document.createElement('div'); presets.className = 'allocator-presets'
  const presetEqual = document.createElement('button'); presetEqual.className = 'btn-sm'; presetEqual.textContent = 'Equal'
  const presetLowImp = document.createElement('button'); presetLowImp.className = 'btn-sm'; presetLowImp.textContent = 'Low Impurity'
  const presetHighRet = document.createElement('button'); presetHighRet.className = 'btn-sm'; presetHighRet.textContent = 'High Return'
  presets.appendChild(presetEqual); presets.appendChild(presetLowImp); presets.appendChild(presetHighRet)
  header.appendChild(presets)
  const rowsDiv = document.createElement('div'); rowsDiv.className = 'alloc-rows'; alloc.appendChild(rowsDiv)
  const remaining = document.createElement('div'); remaining.className = 'remaining'; alloc.appendChild(remaining)
  const sliders = {}; let totalPct = 0; const allocState = { ...currentAllocation }

  function applyPreset(type) {
    const n = assets.length + 1
    if (type === 'equal') {
      const eq = 1 / n
      assets.forEach(a => { allocState[a.id] = eq })
      allocState.cash = eq
    } else if (type === 'low-impurity') {
      const sorted = [...assets].sort((a, b) => a.impurityRatio - b.impurityRatio)
      allocState.cash = 0.05
      const remainingPct = 0.95
      sorted.forEach((a, i) => { allocState[a.id] = i === 0 ? remainingPct * 0.5 : remainingPct * 0.5 / (sorted.length - 1) })
    } else if (type === 'high-return') {
      allocState.cash = 0
      assets.forEach((a, i) => { allocState[a.id] = i === 0 ? 0.4 : 0.12 })
    }
    totalPct = Object.values(allocState).reduce((s, v) => s + v, 0)
    assets.forEach(a => {
      const s = sliders[a.id]
      if (s) { s.value = (allocState[a.id] || 0) * 100 }
      const pctEl = document.getElementById(`pct-${a.id}`)
      if (pctEl) pctEl.textContent = `${((allocState[a.id] || 0) * 100).toFixed(0)}%`
    })
    const cs = sliders.cash
    if (cs) { cs.value = (allocState.cash || 0) * 100 }
    const cashPctEl = document.getElementById('pct-cash')
    if (cashPctEl) cashPctEl.textContent = `${((allocState.cash || 0) * 100).toFixed(0)}%`
    updateRemaining()
  }

  presetEqual.addEventListener('click', () => applyPreset('equal'))
  presetLowImp.addEventListener('click', () => applyPreset('low-impurity'))
  presetHighRet.addEventListener('click', () => applyPreset('high-return'))

  assets.forEach(asset => {
    const pct = allocState[asset.id] || 0; totalPct += pct
    const row = document.createElement('div'); row.className = 'alloc-row'
    const label = document.createElement('div'); label.className = 'alloc-label'
    label.innerHTML = `
      <span class="alloc-name">${asset.name}</span>
      <span class="alloc-impurity-label">${(asset.impurityRatio * 100).toFixed(0)}% imp.</span>
    `
    row.appendChild(label)
    const slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = 100
    slider.value = pct * 100; slider.className = 'alloc-slider'; slider.dataset.assetId = asset.id
    sliders[asset.id] = slider; row.appendChild(slider)
    const pctDisplay = document.createElement('span'); pctDisplay.className = 'alloc-pct'; pctDisplay.id = `pct-${asset.id}`
    pctDisplay.textContent = `${(pct * 100).toFixed(0)}%`; row.appendChild(pctDisplay)
    rowsDiv.appendChild(row)
    slider.addEventListener('input', () => {
      const oldVal = allocState[asset.id] || 0; const newVal = +slider.value / 100
      allocState[asset.id] = newVal; totalPct = totalPct - oldVal + newVal
      const pctEl = document.getElementById(`pct-${asset.id}`)
      if (pctEl) pctEl.textContent = `${(newVal * 100).toFixed(0)}%`; updateRemaining()
    })
  })

  const cashRow = document.createElement('div'); cashRow.className = 'alloc-row'
  const cashLabel = document.createElement('div'); cashLabel.className = 'alloc-label'
  const cashPct = allocState.cash || 0
  cashLabel.innerHTML = `<span class="alloc-name">Cash (Safe)</span><span class="alloc-impurity-label">0% imp.</span>`
  cashRow.appendChild(cashLabel)
  const cashSlider = document.createElement('input'); cashSlider.type = 'range'; cashSlider.min = 0; cashSlider.max = 100
  cashSlider.value = cashPct * 100; cashSlider.className = 'alloc-slider'; cashRow.appendChild(cashSlider)
  sliders.cash = cashSlider
  const cashPctDisplay = document.createElement('span'); cashPctDisplay.className = 'alloc-pct'; cashPctDisplay.id = 'pct-cash'
  cashPctDisplay.textContent = `${(cashPct * 100).toFixed(0)}%`; cashRow.appendChild(cashPctDisplay)
  rowsDiv.appendChild(cashRow)
  cashSlider.addEventListener('input', () => {
    const oldVal = allocState.cash || 0; const newVal = +cashSlider.value / 100
    allocState.cash = newVal; totalPct = totalPct - oldVal + newVal
    document.getElementById('pct-cash').textContent = `${(newVal * 100).toFixed(0)}%`; updateRemaining()
  })

  function updateRemaining() {
    const left = 1 - totalPct
    remaining.textContent = `Remaining: ${(left * 100).toFixed(0)}%`
    remaining.className = 'remaining' + (left < 0 ? ' over' : '')
  }
  updateRemaining()

  const submitBtn = document.createElement('button')
  submitBtn.className = 'btn btn-primary alloc-submit-btn'
  submitBtn.textContent = isRebalance ? 'Confirm Rebalance' : 'Submit Allocation'
  submitBtn.addEventListener('click', () => {
    const pctDiff = Math.abs(1 - totalPct)
    if (pctDiff > 0.01) {
      remaining.textContent = `Must allocate 100% (currently ${(totalPct * 100).toFixed(0)}%)`; remaining.className = 'remaining over'; return
    }
    submitBtn.disabled = true; onSubmit({ ...allocState })
  })
  alloc.appendChild(submitBtn)
  container.appendChild(alloc)
}
