import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-80 space-y-4">
        <h1 className="text-2xl font-bold text-indigo-700 text-center">Heliud POS</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario" className="w-full border rounded px-3 py-2 text-sm" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña" className="w-full border rounded px-3 py-2 text-sm" required />
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700">
          Entrar
        </button>
      </form>
    </div>
  )
}
