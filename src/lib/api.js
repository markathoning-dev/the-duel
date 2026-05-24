const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchGameData(seed = 42) {
  const url = `${API_BASE}/generate-game?seed=${seed}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}
