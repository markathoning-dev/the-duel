export function createAllocator(container, assets, currentAllocation, onSubmit, options = {}) {
  container.innerHTML = ''
  const alloc = document.createElement('div')
  alloc.className = 'allocator'

  const isRebalance = options.isRebalance || false

  const rowsDiv = document.createElement('div')
  rowsDiv.className = 'alloc-rows'
  alloc.appendChild(rowsDiv)

  const remaining = document.createElement('div')
  remaining.className = 'remaining'
  alloc.appendChild(remaining)

  const sliders = {}
  let totalPct = 0
  const allocState = { ...currentAllocation }

  assets.forEach(asset => {
    const pct = allocState[asset.id] || 0
    totalPct += pct

    const row = document.createElement('div')
    row.className = 'alloc-row'

    const label = document.createElement('div')
    label.className = 'alloc-label'
    label.innerHTML = `
      <span class="alloc-name">${asset.name}</span>
      <span class="alloc-pct" id="pct-${asset.id}">${(pct * 100).toFixed(0)}%</span>
    `
    row.appendChild(label)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = 0
    slider.max = 100
    slider.value = pct * 100
    slider.className = 'alloc-slider'
    slider.dataset.assetId = asset.id
    sliders[asset.id] = slider
    row.appendChild(slider)

    const impurity = document.createElement('span')
    impurity.className = 'alloc-impurity'
    impurity.textContent = `${(asset.impurityRatio * 100).toFixed(0)}%`
    row.appendChild(impurity)

    rowsDiv.appendChild(row)

    slider.addEventListener('input', () => {
      const oldVal = allocState[asset.id] || 0
      const newVal = +slider.value / 100
      allocState[asset.id] = newVal
      totalPct = totalPct - oldVal + newVal
      const pctEl = document.getElementById(`pct-${asset.id}`)
      if (pctEl) pctEl.textContent = `${(newVal * 100).toFixed(0)}%`
      updateRemaining()
    })
  })

  // Cash row
  const cashRow = document.createElement('div')
  cashRow.className = 'alloc-row'
  const cashLabel = document.createElement('div')
  cashLabel.className = 'alloc-label'
  const cashPct = allocState.cash || 0
  cashLabel.innerHTML = `
    <span class="alloc-name">Cash</span>
    <span class="alloc-pct" id="pct-cash">${(cashPct * 100).toFixed(0)}%</span>
  `
  cashRow.appendChild(cashLabel)
  const cashSlider = document.createElement('input')
  cashSlider.type = 'range'
  cashSlider.min = 0
  cashSlider.max = 100
  cashSlider.value = cashPct * 100
  cashSlider.className = 'alloc-slider'
  cashRow.appendChild(cashSlider)
  const cashInfo = document.createElement('span')
  cashInfo.className = 'alloc-impurity'
  cashInfo.textContent = '0%'
  cashRow.appendChild(cashInfo)
  rowsDiv.appendChild(cashRow)

  cashSlider.addEventListener('input', () => {
    const oldVal = allocState.cash || 0
    const newVal = +cashSlider.value / 100
    allocState.cash = newVal
    totalPct = totalPct - oldVal + newVal
    document.getElementById('pct-cash').textContent = `${(newVal * 100).toFixed(0)}%`
    updateRemaining()
  })

  function updateRemaining() {
    const left = 1 - totalPct
    remaining.textContent = `Unallocated: ${(left * 100).toFixed(0)}%`
    remaining.className = 'remaining' + (left < 0 ? ' over' : '')
  }
  updateRemaining()

  const submitBtn = document.createElement('button')
  submitBtn.className = 'btn btn-primary alloc-submit-btn'
  submitBtn.textContent = isRebalance ? 'Confirm Rebalance' : 'Submit Allocation'
  submitBtn.addEventListener('click', () => {
    const pctDiff = Math.abs(1 - totalPct)
    if (pctDiff > 0.01) {
      remaining.textContent = `Must allocate 100% (currently ${(totalPct * 100).toFixed(0)}%)`
      remaining.className = 'remaining over'
      return
    }
    submitBtn.disabled = true
    onSubmit({ ...allocState })
  })
  alloc.appendChild(submitBtn)

  container.appendChild(alloc)
}
