import { create } from 'zustand'
import api from '../services/api'

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { role: payload.role || 'cashier', username: payload.sub || '' }
  } catch { return { role: 'cashier', username: '' } }
}

const storedToken = localStorage.getItem('token')

export const useAuthStore = create((set) => ({
  token: storedToken,
  role: storedToken ? parseToken(storedToken).role : null,
  username: storedToken ? parseToken(storedToken).username : null,

  login: async (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('token', data.access_token)
    const parsed = parseToken(data.access_token)
    set({ token: data.access_token, role: parsed.role, username: parsed.username })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, role: null, username: null })
  },
}))
