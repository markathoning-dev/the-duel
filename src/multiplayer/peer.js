import Peer from 'peerjs'

let peer = null
let connection = null

export function createHost() {
  return new Promise((resolve) => {
    peer = new Peer()
    peer.on('open', (id) => {
      resolve({ roomCode: id, onConnection: (cb) => {
        peer.on('connection', (conn) => {
          connection = conn
          cb(conn)
        })
      }})
    })
  })
}

export function joinHost(roomCode) {
  return new Promise((resolve, reject) => {
    peer = new Peer()
    peer.on('open', () => {
      const conn = peer.connect(roomCode, { reliable: true })
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000)
      conn.on('open', () => {
        clearTimeout(timeout)
        connection = conn
        resolve(conn)
      })
      conn.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
    peer.on('error', (err) => reject(err))
  })
}

export function sendMessage(data) {
  if (connection && connection.open) {
    connection.send(data)
  }
}

export function onMessage(cb) {
  if (connection) {
    connection.on('data', cb)
  }
}

export function onDisconnect(cb) {
  if (connection) {
    connection.on('close', cb)
  }
}

export function disconnect() {
  if (connection) {
    connection.close()
    connection = null
  }
  if (peer) {
    peer.destroy()
    peer = null
  }
}
