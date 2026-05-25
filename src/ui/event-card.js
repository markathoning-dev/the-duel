const TYPE_META = {
  rate_decision: { icon: '\u{1F3E6}', label: 'Rate Decision' },
  sector_shock: { icon: '\u26A1', label: 'Sector Shock' },
  regulatory_change: { icon: '\u2696\uFE0F', label: 'Regulatory Change' }
}

export function renderEventCard(container, event) {
  const meta = TYPE_META[event.type] || { icon: '\u{1F4E2}', label: 'Event' }
  container.innerHTML = `<div class="event-card event-${event.type}" data-quarter="${event.quarter}">
      <div class="event-card-icon">${meta.icon}</div>
      <div class="event-card-body"><div class="event-card-title">${meta.label}</div><div class="event-card-desc">${event.description}</div></div>
    </div>`
}

export function renderEventTimeline(container, events, currentQuarter) {
  const quarterEvents = events.filter(e => e.quarter === currentQuarter)
  if (quarterEvents.length === 0) { container.innerHTML = '<div class="event-timeline-empty">No events this quarter</div>'; return }
  container.innerHTML = quarterEvents.map(e => `
    <div class="event-card event-${e.type}">
      <div class="event-card-icon">${(TYPE_META[e.type] || {}).icon || '\u{1F4E2}'}</div>
      <div class="event-card-body"><div class="event-card-title">${(TYPE_META[e.type] || {}).label || 'Event'}</div><div class="event-card-desc">${e.description}</div></div>
    </div>`).join('')
}
