import { createHost, joinHost, sendMessage, onMessage, onDisconnect } from './peer.js'

export async function setupHost(onGuestMessage, onGuestJoined) {
  const { roomCode, onConnection } = await createHost()

  onConnection((conn) => {
    onGuestJoined(conn)

    conn.on('data', (data) => {
      onGuestMessage(data)
    })

    conn.on('close', () => {
      console.log('Guest disconnected')
    })
  })

  return roomCode
}

export async function setupGuest(roomCode, onMessage) {
  const conn = await joinHost(roomCode)

  conn.on('data', (data) => {
    onMessage(data)
  })

  return conn
}

export function send(data) {
  sendMessage(data)
}
