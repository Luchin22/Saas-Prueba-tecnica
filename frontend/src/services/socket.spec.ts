import { describe, it, expect, vi, beforeEach } from 'vitest'
import { io } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from './socket'

vi.mock('socket.io-client', () => ({
  io: vi.fn<() => { disconnect: () => void; on: () => void }>(() => ({
    disconnect: vi.fn<() => void>(),
    on: vi.fn<() => void>(),
  })),
}))

describe('socket service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    disconnectSocket()
  })

  it('connectSocket creates and returns a socket authenticated with the token', () => {
    const socket = connectSocket('jwt-token')

    expect(io).toHaveBeenCalledWith(expect.any(String), {
      auth: { token: 'jwt-token' },
      transports: ['websocket'],
    })
    expect(getSocket()).toBe(socket)
  })

  it('connectSocket disconnects a previous socket before creating a new one', () => {
    const first = connectSocket('token-1')
    connectSocket('token-2')

    expect(first.disconnect).toHaveBeenCalled()
  })

  it('disconnectSocket tears down the current socket and clears it', () => {
    const socket = connectSocket('jwt-token')

    disconnectSocket()

    expect(socket.disconnect).toHaveBeenCalled()
    expect(getSocket()).toBeNull()
  })
})
