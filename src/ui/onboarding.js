export function showOnboarding(container) {
  const alreadySeen = localStorage.getItem('theduel-onboarding-complete')
  if (alreadySeen) return

  const steps = [
    {
      title: 'Welcome to The Duel',
      desc: 'Compete against an opponent to build the best Sharia-compliant portfolio over 4 quarters. Allocate your capital, balance return vs purity, and outsmart your rival.',
      highlight: '#dashboard'
    },
    {
      title: 'Making Allocations',
      desc: 'Drag sliders to distribute your capital across 6 assets. Watch the purity scores — high-return assets may carry more impurity. You can also hold cash for a risk-free but lower return.',
      highlight: '#allocator-container'
    },
    {
      title: 'Scoring',
      desc: 'Your score = portfolio return × (1 − portfolio impurity). Events and market shocks will test your strategy. Highest adjusted return after 4 quarters wins!',
      highlight: '#side-panel'
    }
  ]

  let currentStep = 0

  const overlay = document.createElement('div')
  overlay.className = 'onboarding-overlay'
  overlay.innerHTML = `
    <div class="onboarding-card">
      <div class="onboarding-step-indicator">Step ${currentStep + 1} of ${steps.length}</div>
      <h3 class="onboarding-title">${steps[0].title}</h3>
      <p class="onboarding-desc">${steps[0].desc}</p>
      <div class="onboarding-dots">
        ${steps.map((_, i) => `<span class="onboarding-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
      </div>
      <div class="onboarding-actions">
        <button class="btn btn-secondary" id="onboarding-skip">Skip Tutorial</button>
        <button class="btn btn-primary" id="onboarding-next">Next</button>
      </div>
    </div>
  `
  container.appendChild(overlay)

  const titleEl = overlay.querySelector('.onboarding-title')
  const descEl = overlay.querySelector('.onboarding-desc')
  const dots = overlay.querySelectorAll('.onboarding-dot')
  const stepIndicator = overlay.querySelector('.onboarding-step-indicator')

  function advance() {
    currentStep++
    if (currentStep >= steps.length) {
      overlay.remove()
      localStorage.setItem('theduel-onboarding-complete', 'true')
      return
    }
    titleEl.textContent = steps[currentStep].title
    descEl.textContent = steps[currentStep].desc
    stepIndicator.textContent = `Step ${currentStep + 1} of ${steps.length}`
    dots.forEach((d, i) => d.classList.toggle('active', i === currentStep))
    if (currentStep === steps.length - 1) {
      overlay.querySelector('#onboarding-next').textContent = 'Got It!'
    }
  }

  overlay.querySelector('#onboarding-next').onclick = advance
  overlay.querySelector('#onboarding-skip').onclick = () => {
    overlay.remove()
    localStorage.setItem('theduel-onboarding-complete', 'true')
  }
}

export function resetOnboarding() {
  localStorage.removeItem('theduel-onboarding-complete')
}
